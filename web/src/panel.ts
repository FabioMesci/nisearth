import { Chart, LineController, LineElement, PointElement, BarController, BarElement, LinearScale, CategoryScale, Tooltip, Filler } from 'chart.js'
import type { DetailView, ViewMode, Pol } from './detail'
import type { Manifest } from './types'
import { CONTENT, KIND_META } from './content'
import { t, locale, metricLabel, fmtDay } from './i18n'
import { ICON } from './icons'

Chart.register(LineController, LineElement, PointElement, BarController, BarElement, LinearScale, CategoryScale, Tooltip, Filler)

const fmtDate = (d: string) => new Date(d).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' })
const fmtNum = (v: number) => v.toLocaleString(locale(), { maximumFractionDigits: Math.abs(v) >= 1000 ? 0 : 1 })

export class Panel {
  private el: HTMLElement
  private chart?: Chart
  private chart2?: Chart
  private timer = 0
  private view: DetailView

  constructor(el: HTMLElement, view: DetailView) {
    this.el = el
    this.view = view
  }

  private m?: Manifest

  /** Vuelve a pintar el panel (p. ej. al cambiar de idioma) conservando el estado de la vista */
  rerender() {
    if (this.m) this.render(this.m, true)
  }

  render(m: Manifest, keepState = false) {
    this.m = m
    const c = CONTENT[m.id]
    const meta = KIND_META[m.kind]
    const v = this.view
    if (!keepState) {
      // modo y polarización por defecto según el tipo de evento
      v.mode = 'compare'
      v.pol = m.kind === 'fire' ? 'hv' : 'hh'
      v.showMask = false
      v.sensor = 'L'
      v.showFirms = false
    }

    this.el.style.setProperty('--accent', meta.color)
    this.el.innerHTML = `
      <div class="p-head">
        <h2>${c.headline}</h2>
        <div class="meta"><span class="chip">${meta.icon}${meta.label}</span><span>${c.place}</span><span class="mono">${c.dateLabel}</span></div>
        ${m.mock ? `<div class="mock">${t('mock')}</div>` : ''}
      </div>
      <p class="summary">${c.summary}</p>
      ${c.passes ? `<section class="sec"><div class="label">${t('passes')}</div>${passesSvg(c.passes)}<div class="legend"><span><i class="nisar"></i>${t('legendL')}</span><span><i class="s1"></i>${t('legendC')}</span><span><i class="ev"></i>${t('legendEv')}</span></div></section>` : ''}

      <section class="sec controls">
        <div class="label">${t('radarView')}</div>
        <div class="seg" id="seg-mode">
          <button data-v="compare">${t('compare')}</button>
          <button data-v="timeline">${t('timeline')}</button>
          <button data-v="change">${t('change')}</button>
        </div>
        ${m.s1 ? `<div class="seg" id="seg-sensor">
          <button data-v="L" title="NISAR · 24 cm">${t('bandL')}</button>
          <button data-v="C" title="Sentinel-1 · 5.5 cm">${t('bandC')}</button>
        </div>` : ''}
        <div class="row">
          <div class="seg small" id="seg-pol">
            <button data-v="hh" title="${t('titleHH')}">HH</button>
            <button data-v="hv" title="${t('titleHV')}">HV</button>
            ${m.frames[0]?.rgb ? `<button data-v="rgb" title="${t('titleRGB')}">RGB</button>` : ''}
          </div>
          <label class="toggle"><input type="checkbox" id="chk-mask" ${v.showMask ? 'checked' : ''} /> <span>${m.kind === 'flood' ? t('maskWater') : t('maskBurn')}</span></label>
        </div>
        <div class="row toggles">
          ${m.overlays.rail || m.overlays.roads ? `<label class="toggle"><input type="checkbox" id="chk-infra" ${v.showInfra ? 'checked' : ''} /> <span>${t('infra')}</span></label>` : ''}
          ${m.overlays.effis || m.overlays.ems ? `<label class="toggle"><input type="checkbox" id="chk-ref" ${v.showRef ? 'checked' : ''} /> <span>${m.overlays.ems ? t('ems') : t('effis')}</span></label>` : ''}
          ${m.overlays.firms ? `<label class="toggle"><input type="checkbox" id="chk-firms" ${v.showFirms ? 'checked' : ''} /> <span>${t('firms')}</span></label>` : ''}
        </div>
        <div class="timeline" id="timeline">
          <button id="play" class="btn icon" aria-label="Reproducir">${ICON.play}</button>
          <input type="range" id="frame" min="0" max="${v.frames.length - 1}" step="1" />
          <span id="frame-date" class="mono"></span>
        </div>
        <label class="opacity"><span>${t('opacity')}</span><input type="range" id="opacity" min="0" max="1" step="0.05" value="${v.sarOpacity}" /></label>
        <p class="hint" id="mode-hint"></p>
      </section>

      <section class="metrics">
        ${m.metrics.map((x) => `<div class="metric"><b>${fmtNum(x.value)}<small> ${x.unit}</small></b><span>${metricLabel(x.id, m.kind, x.label)}</span></div>`).join('')}
      </section>

      ${m.landcover ? landcoverCard(m) : ''}

      <section class="sec">
        <div class="label">${t('chart')}</div>
        <div class="chart-box"><canvas id="chart"></canvas></div>
      </section>

      ${m.daily ? `<section class="sec">
        <div class="label">${m.daily.kind === 'rain' ? t('rainChart')(m.daily.place ?? '') : t('firmsChart')}</div>
        <div class="chart-box"><canvas id="chart2"></canvas></div>
        <p class="hint">${m.daily.kind === 'rain' ? t('rainNote') : t('firmsNote')(m.firms?.in_mask_pct ?? 0)}</p>
      </section>` : ''}

      <section class="sec">
        <div class="label">${t('why')}</div>
        ${c.why.map((w) => `<details class="why"><summary>${w.title}</summary><p>${w.text}</p></details>`).join('')}
      </section>

      <section class="sec">
        <div class="label">${t('who')}</div>
        <div class="who">${c.who.map((w) => `<div><b>${w.title}</b><span>${w.text}</span></div>`).join('')}</div>
      </section>

      <footer class="src">
        ${t('source')(m.frames[0]?.track ?? 0, fmtDate(m.pair.before), fmtDate(m.pair.after), !!m.s1)}${m.daily ? ` · ${m.daily.kind === 'rain' ? t('srcRain') : t('srcFirms')}` : ''}
      </footer>
    `
    this.bind(m)
    // el mapa crea sus capas antes de que el panel fije los valores por defecto: sincronizarlas
    v.setFirms(v.showFirms)
    v.setMask(v.showMask)
    this.sync()
    this.drawChart(m)
    this.drawDaily(m)
  }

  private bind(m: Manifest) {
    const v = this.view
    const $ = <T extends HTMLElement>(s: string) => this.el.querySelector<T>(s)!
    $('#seg-mode').onclick = (e) => {
      const b = (e.target as HTMLElement).closest('button')
      if (!b) return
      this.stop()
      v.setMode(b.dataset.v as ViewMode)
      this.sync()
    }
    const segSensor = this.el.querySelector<HTMLElement>('#seg-sensor')
    if (segSensor)
      segSensor.onclick = (e) => {
        const b = (e.target as HTMLElement).closest('button')
        if (!b) return
        this.stop()
        v.setSensor(b.dataset.v as 'L' | 'C')
        this.el.querySelector<HTMLInputElement>('#frame')!.max = String(v.frames.length - 1)
        this.sync()
      }
    $('#seg-pol').onclick = (e) => {
      const b = (e.target as HTMLElement).closest('button')
      if (!b) return
      v.setPol(b.dataset.v as Pol)
      this.sync()
    }
    $<HTMLInputElement>('#chk-mask').onchange = (e) => v.setMask((e.target as HTMLInputElement).checked)
    this.el.querySelector<HTMLInputElement>('#chk-infra')?.addEventListener('change', (e) => v.setInfra((e.target as HTMLInputElement).checked))
    this.el.querySelector<HTMLInputElement>('#chk-firms')?.addEventListener('change', (e) => v.setFirms((e.target as HTMLInputElement).checked))
    this.el.querySelector<HTMLInputElement>('#chk-ref')?.addEventListener('change', (e) => v.setRef((e.target as HTMLInputElement).checked))
    $<HTMLInputElement>('#opacity').oninput = (e) => v.setOpacity(+(e.target as HTMLInputElement).value)
    $<HTMLInputElement>('#frame').oninput = (e) => {
      if (v.mode !== 'timeline') v.setMode('timeline')
      v.setFrame(+(e.target as HTMLInputElement).value)
      this.sync()
    }
    $('#play').onclick = () => (this.timer ? this.stop() : this.play())
    v.onFrame = (f, i) => {
      $<HTMLInputElement>('#frame').value = String(i)
      const ev = new Date(f.date) > new Date(m.event)
      $('#frame-date').innerHTML = `${fmtDate(f.date)} <em class="${ev ? 'post' : 'pre'}">${ev ? t('post') : t('pre')}</em>`
      this.chart?.setActiveElements([{ datasetIndex: 0, index: Math.min(i, m.series.dates.length - 1) }])
      this.chart?.update('none')
    }
  }

  private play() {
    const v = this.view
    if (v.mode !== 'timeline') v.setMode('timeline')
    this.sync()
    this.el.querySelector('#play')!.innerHTML = ICON.pause
    this.timer = window.setInterval(() => v.setFrame(v.frameIdx + 1), 900)
  }

  stop() {
    clearInterval(this.timer)
    this.timer = 0
    const b = this.el.querySelector('#play')
    if (b) b.innerHTML = ICON.play
  }

  private sync() {
    const v = this.view
    this.el.querySelectorAll<HTMLButtonElement>('#seg-mode button').forEach((b) => b.classList.toggle('on', b.dataset.v === v.mode))
    this.el.querySelectorAll<HTMLButtonElement>('#seg-pol button').forEach((b) => {
      b.classList.toggle('on', b.dataset.v === v.pol)
      if (b.dataset.v !== 'rgb') b.textContent = v.sensor === 'C' ? (b.dataset.v === 'hh' ? 'VV' : 'VH') : b.dataset.v!.toUpperCase()
    })
    this.el.querySelectorAll<HTMLButtonElement>('#seg-sensor button').forEach((b) => b.classList.toggle('on', b.dataset.v === v.sensor))
    this.el.querySelector<HTMLElement>('#seg-pol')!.classList.toggle('disabled', v.mode === 'change')
    const hints: Record<ViewMode, string> = { compare: t('hintCompare'), timeline: t('hintTimeline'), change: t('hintChange') }
    this.el.querySelector('#mode-hint')!.textContent = hints[v.mode]
    if (v.mode !== 'timeline') this.el.querySelector('#frame-date')!.textContent = ''
  }

  /** Barras diarias: lluvia (Open-Meteo) o focos FIRMS. En lluvia se marcan las pasadas NISAR. */
  private drawDaily(m: Manifest) {
    this.chart2?.destroy()
    this.chart2 = undefined
    const d = m.daily
    const ctx = this.el.querySelector<HTMLCanvasElement>('#chart2')
    if (!d || !ctx) return
    const rain = d.kind === 'rain'
    const color = rain ? '#5cb8f2' : '#ff8a3d'
    const marks = rain ? [m.pair.before, m.pair.after] : []
    const unit = rain ? 'mm' : t('hotspots')
    this.chart2 = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: d.dates.map((x) => fmtDay(x)),
        datasets: [{ data: d.values, backgroundColor: d.dates.map((x) => (marks.includes(x) ? '#e2e8f0' : color)), borderRadius: 2, maxBarThickness: 18 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { tooltip: { callbacks: { label: (c) => `${fmtNum(c.parsed.y ?? 0)} ${unit}` } } },
        scales: {
          x: { ticks: { color: '#8b93a7', font: { size: 10, family: 'Geist Mono' }, maxRotation: 0, autoSkipPadding: 10 }, grid: { display: false } },
          y: { beginAtZero: true, ticks: { color: '#8b93a7', font: { size: 10, family: 'Geist Mono' } }, grid: { color: 'rgba(255,255,255,0.06)' } },
        },
      },
      plugins: [
        {
          id: 'passes',
          afterDraw: (ch) => {
            const g = ch.ctx
            for (const date of marks) {
              const j = d.dates.indexOf(date)
              if (j < 0) continue
              const x = ch.scales.x.getPixelForValue(j)
              g.save()
              g.strokeStyle = '#e2e8f0'
              g.setLineDash([3, 3])
              g.beginPath()
              g.moveTo(x, ch.chartArea.top)
              g.lineTo(x, ch.chartArea.bottom)
              g.stroke()
              g.fillStyle = '#e2e8f0'
              g.font = '500 10px "Geist Mono"'
              g.textAlign = j < d.dates.length / 2 ? 'left' : 'right'
              g.fillText('NISAR', x + (j < d.dates.length / 2 ? 4 : -4), ch.chartArea.top + 10)
              g.restore()
            }
          },
        },
      ],
    })
  }

  private drawChart(m: Manifest) {
    this.chart?.destroy()
    const accent = KIND_META[m.kind].color
    const ctx = this.el.querySelector<HTMLCanvasElement>('#chart')!
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: m.series.dates.map((d) => new Date(d).toLocaleDateString(locale(), { day: 'numeric', month: 'short' })),
        datasets: [
          { label: 'HH', data: m.series.hh, borderColor: m.kind === 'flood' ? accent : '#94a3b8', backgroundColor: 'transparent', tension: 0.3, pointRadius: 0, pointHoverRadius: 4, borderWidth: 2 },
          { label: 'HV', data: m.series.hv, borderColor: m.kind === 'fire' ? accent : '#94a3b8', backgroundColor: 'transparent', tension: 0.3, pointRadius: 0, pointHoverRadius: 4, borderWidth: 2, borderDash: m.kind === 'flood' ? [4, 4] : [] },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${(c.parsed.y ?? 0).toFixed(1)} dB` } } },
        scales: {
          x: { ticks: { color: '#8b93a7', font: { size: 10, family: 'Geist Mono' }, maxRotation: 0, autoSkipPadding: 12 }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { ticks: { color: '#8b93a7', font: { size: 10, family: 'Geist Mono' } }, grid: { color: 'rgba(255,255,255,0.06)' } },
        },
      },
      plugins: [
        {
          id: 'notes',
          afterDraw: (ch) => {
            const notes = CONTENT[m.id]?.notes ?? []
            const g = ch.ctx
            const dates = m.series.dates
            for (const n of notes) {
              const j = dates.findIndex((d) => d >= n.date)
              if (j < 0) continue
              const t = (k: number) => new Date(dates[k]).getTime()
              const xj = ch.scales.x.getPixelForValue(j)
              const x = j === 0 ? xj : ch.scales.x.getPixelForValue(j - 1) + ((xj - ch.scales.x.getPixelForValue(j - 1)) * (new Date(n.date).getTime() - t(j - 1))) / (t(j) - t(j - 1))
              g.save()
              g.strokeStyle = accent
              g.setLineDash([3, 3])
              g.beginPath()
              g.moveTo(x, ch.chartArea.top)
              g.lineTo(x, ch.chartArea.bottom)
              g.stroke()
              g.fillStyle = accent
              g.font = '500 10px "Geist Mono"'
              g.fillText(n.label.toUpperCase(), x + 4, ch.chartArea.top + 10)
              g.restore()
            }
          },
        },
      ],
    })
  }
}

const LC_COLORS: Record<string, string> = {
  tree: '#2f7d4a', shrub: '#8fae3c', grass: '#d8c35a', crop: '#e39b4a', built: '#c4484a',
  bare: '#9a8f84', water: '#3a8fd6', wetland: '#5cc7c0', other: '#55617a',
}

/** Barra apilada de cobertura del suelo + nota de población */
function landcoverCard(m: Manifest) {
  const lc = m.landcover!
  const fire = m.kind === 'fire'
  const names = t('lc')
  const rows = lc.inside.filter((r) => r.pct >= 0.5)
  const fmt = (v: number) => v.toLocaleString(locale(), { maximumFractionDigits: 0 })
  const crop = lc.outside_ref?.find((r) => r.cls === 'crop')
  const ex = m.exposure
  const pop = ex ? (fire ? t('lcPop')(fmt(ex.pop_inside), fmt(Math.round((ex.pop_1km ?? 0) / 10) * 10)) : t('lcPopFlood')(fmt(ex.pop_inside))) : ''
  return `<section class="sec">
    <div class="label">${t('lcTitle')(fire)}</div>
    <div class="lc-bar" role="img" aria-label="${rows.map((r) => `${names[r.cls] ?? r.cls} ${r.pct}%`).join(', ')}">
      ${rows.map((r) => `<i style="flex:${r.pct};background:${LC_COLORS[r.cls] ?? LC_COLORS.other}" title="${names[r.cls] ?? r.cls}: ${fmt(r.ha)} ha"></i>`).join('')}
    </div>
    <div class="lc-legend">
      ${rows.map((r) => `<span><i style="background:${LC_COLORS[r.cls] ?? LC_COLORS.other}"></i>${names[r.cls] ?? r.cls}<b>${fmt(r.ha)} ha · ${r.pct.toLocaleString(locale(), { maximumFractionDigits: 0 })} %</b></span>`).join('')}
    </div>
    ${crop && crop.pct >= 30 ? `<p class="hint">${t('lcOutside')(Math.round(crop.pct), fmt(crop.ha))}</p>` : ''}
    ${pop ? `<p class="hint">${pop}</p>` : ''}
    <p class="hint src-inline">${t('srcLc')}</p>
  </section>`
}

function passesSvg(p: NonNullable<(typeof CONTENT)[string]['passes']>) {
  const W = 340, H = 92, L = 8, R = 8
  const t0 = new Date(p.from).getTime(), t1 = new Date(p.to).getTime()
  const x = (d: string) => L + ((new Date(d).getTime() - t0) / (t1 - t0)) * (W - L - R)
  const rowY = { NISAR: 30, S1C: 52, S1D: 52 } as const
  const days: string[] = []
  for (let t = t0; t <= t1; t += 86400000) days.push(new Date(t).toISOString().slice(0, 10))
  const ev0 = x(p.event[0]), ev1 = x(p.event[1])
  // hueco sin ninguna pasada que contiene el evento
  const ts = p.list.map((q) => new Date(q.date).getTime()).sort((a, b) => a - b)
  const evT = new Date(p.event[0]).getTime()
  const before = Math.max(...ts.filter((t) => t <= evT)), after = Math.min(...ts.filter((t) => t > evT))
  const gx0 = x(new Date(before).toISOString()), gx1 = x(new Date(after).toISOString())
  const gapDays = ((after - before) / 86400000).toLocaleString(locale(), { maximumFractionDigits: 1 })
  return `<svg class="passes" viewBox="0 0 ${W} ${H}" role="img" aria-label="Pasadas de radar alrededor del evento">
    <rect x="${gx0}" y="16" width="${gx1 - gx0}" height="48" fill="rgba(239,68,68,0.10)" stroke="rgba(239,68,68,0.5)" stroke-dasharray="3 3"/>
    <text x="${(gx0 + gx1) / 2}" y="12" text-anchor="middle" class="gap">${t('gap')(gapDays)}</text>
    <rect x="${ev0}" y="18" width="${Math.max(3, ev1 - ev0)}" height="44" class="ev"/>
    <text x="4" y="33" class="row">L</text><text x="4" y="55" class="row">C</text>
    ${p.list.map((q) => `<circle cx="${x(q.date)}" cy="${rowY[q.sensor]}" r="3.6" class="${q.sensor === 'NISAR' ? 'nisar' : 's1'}"><title>${q.sensor} · ${q.date.replace('T', ' ')} UTC</title></circle>`).join('')}
    ${days.filter((_, i) => i % 3 === 1).map((d) => `<text x="${x(d)}" y="${H - 6}" text-anchor="middle" class="tick">${new Date(d).toLocaleDateString(locale(), { day: 'numeric', month: 'short' })}</text>`).join('')}
  </svg>`
}
