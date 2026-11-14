import { Chart, LineController, LineElement, PointElement, BarController, BarElement, LinearScale, CategoryScale, Tooltip, Filler } from 'chart.js'
import { RISK_COLORS, type DetailView, type ViewMode, type Pol } from './detail'
import type { Manifest } from './types'
import { CONTENT, KIND_META } from './content'
import { t, locale, metricLabel, fmtDay, fmtDec } from './i18n'
import { ICON } from './icons'

Chart.register(LineController, LineElement, PointElement, BarController, BarElement, LinearScale, CategoryScale, Tooltip, Filler)

const fmtDate = (d: string) => fmtDay(d, { day: 'numeric', month: 'short', year: 'numeric' })
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
    if (this.m) this.render(this.m)
  }

  /** Pinta el panel a partir del estado de la vista (los valores por defecto de cada caso los fija DetailView.open) */
  render(m: Manifest) {
    this.m = m
    const c = CONTENT[m.id]
    const meta = KIND_META[m.kind]
    const v = this.view

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
          ${m.overlays.risk ? `<label class="toggle"><input type="checkbox" id="chk-risk" ${v.showRisk ? 'checked' : ''} /> <span>${t('riskToggle')}</span></label>` : ''}
        </div>
        <div class="timeline" id="timeline">
          <button id="play" class="btn icon" aria-label="${t('play')}">${this.timer ? ICON.pause : ICON.play}</button>
          <input type="range" id="frame" min="0" max="${v.frames.length - 1}" step="1" />
          <span id="frame-date" class="mono"></span>
        </div>
        <label class="opacity"><span>${t('opacity')}</span><input type="range" id="opacity" min="0" max="1" step="0.05" value="${v.sarOpacity}" /></label>
        <p class="hint" id="mode-hint"></p>
      </section>

      <section class="metrics">
        ${m.metrics.map((x) => `<div class="metric"><b>${fmtNum(x.value)}<small> ${x.unit}</small></b><span>${metricLabel(x.id, m.kind, x.label)}</span></div>`).join('')}
      </section>

      ${m.risk ? riskCard(m) : ''}

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
        ${t('source')(m.frames[0]?.track ?? 0, fmtDate(m.pair.before), fmtDate(m.pair.after), !!m.s1, m.overlays.ems ? `Copernicus EMS ${m.stats?.ems_code ?? ''}`.trim() : m.overlays.effis ? 'EFFIS' : '')}${m.daily ? ` · ${m.daily.kind === 'rain' ? t('srcRain') : t('srcFirms')}` : ''}
      </footer>
    `
    this.bind(m)
    // las dos casillas de riesgo (controles y tarjeta) reflejan el estado de la vista
    this.el.querySelectorAll<HTMLInputElement>('#chk-risk, #chk-risk2').forEach((c) => (c.checked = v.showRisk))
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
    for (const id of ['#chk-risk', '#chk-risk2'])
      this.el.querySelector<HTMLInputElement>(id)?.addEventListener('change', (e) => {
        const on = (e.target as HTMLInputElement).checked
        v.setRisk(on)
        this.el.querySelectorAll<HTMLInputElement>('#chk-risk, #chk-risk2').forEach((c) => (c.checked = on))
      })
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
      // la serie del gráfico es de NISAR: marcar la fecha, no el índice (en banda C las fechas son otras)
      const j = m.series.dates.indexOf(f.date)
      this.chart?.setActiveElements(j >= 0 ? [{ datasetIndex: 0, index: j }] : [])
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
        labels: m.series.dates.map((d) => fmtDay(d)),
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
        plugins: { tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${fmtDec(c.parsed.y ?? 0, 1)} dB` } } },
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

/** Risk index summary: classes, the three factors, hotspots, cascade, robustness and downloads */
function riskCard(m: Manifest) {
  const r = m.risk!
  const fmt = (v: number) => v.toLocaleString(locale(), { maximumFractionDigits: 0 })
  const names = t('riskClasses')
  const drv = t('riskDriverNames')
  const top = (o: Record<string, number>) => Object.entries(o).sort((a, b) => b[1] - a[1])[0][0]
  const total = r.classes.reduce((s, c) => s + c.area_ha, 0) || 1
  const rows = r.classes.map((c, i) => ({ ...c, i })).filter((c) => c.cells > 0)
  const bar = (label: string, v: number) => `<div class="rp-row"><span>${label}</span><i><b style="width:${Math.round(v * 100)}%"></b></i><em>${fmtDec(v)}</em></div>`
  const seen = new Set<string>()
  const hot = r.hotspots.filter((h) => !seen.has(h.place) && seen.add(h.place)).slice(0, 3)
  const idx = (name: string) => r.classes.findIndex((c) => c.cls === name)
  const cascade = r.cascade.type === 'post_fire_runoff'
    ? t('riskCascadeFire')(fmt(r.cascade.burned_steep_ha ?? 0), r.cascade.roads_km.toLocaleString(locale()))
    : t('riskCascadeFlood')(fmt(r.cascade.rain_mm ?? 0), r.cascade.roads_km.toLocaleString(locale()), r.cascade.rail_km.toLocaleString(locale()))
  return `<section class="sec risk">
    <div class="label">${t('riskTitle')}</div>
    <p class="risk-lead"><b>${fmt(r.pop_high)}</b> ${t('riskPop')(fmt(r.pop_high_range[0]), fmt(r.pop_high_range[1]))}</p>
    <div class="lc-bar" role="img" aria-label="${rows.map((c) => `${names[c.i]} ${fmt(c.area_ha)} ha`).join(', ')}">
      ${rows.map((c) => `<i style="flex:${Math.max(c.area_ha / total, 0.01)};background:${RISK_COLORS[c.i]}" title="${names[c.i]}: ${fmt(c.area_ha)} ha"></i>`).join('')}
    </div>
    <div class="lc-legend">
      ${rows.map((c) => `<span><i style="background:${RISK_COLORS[c.i]}"></i>${names[c.i]}<b>${fmt(c.area_ha)} ha · ${fmt(c.population)} ${t('riskPeople')}</b></span>`).join('')}
    </div>
    <label class="toggle risk-toggle"><input type="checkbox" id="chk-risk2" /> <span>${t('riskShow')}</span></label>
    <div class="risk-factors">
      <p class="hint">${t('riskMean')}</p>
      ${bar(t('riskH'), r.components.hazard)}${bar(t('riskE'), r.components.exposure)}${bar(t('riskV'), r.components.vulnerability)}
      <p class="hint">${t('riskDrivers')(drv[top(r.drivers.exposure)], drv[top(r.drivers.vulnerability)])}</p>
    </div>
    <div class="risk-hot">
      <p class="hint">${t('riskHot')}</p>
      ${hot.map((h) => `<div><span>${t('riskNear')(h.place)}</span><b style="color:${RISK_COLORS[idx(h.class)]}">${names[idx(h.class)]} · ${fmtDec(h.risk)}</b></div>`).join('')}
    </div>
    <p class="hint">${cascade}</p>
    <p class="hint">${t('riskStable')(r.stability.mean_pct, r.stability.runs, r.stability.spread_pct)}</p>
    <div class="risk-dl">
      <a class="btn ghost" href="/data/${m.id}/${r.files.csv}" download="${m.id}_risk.csv">CSV</a>
      <a class="btn ghost" href="/data/${m.id}/${r.files.geojson}" download="${m.id}_risk.geojson">GeoJSON</a>
    </div>
    <p class="hint src-inline">${t('riskMethod')(r.cell_m[0], r.cell_m[1])}</p>
  </section>`
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

/** Instante UTC de una fecha ISO; las horas sin zona ('2026-10-10T06:09') son UTC, no la hora local del visitante */
const utc = (d: string) => new Date(d.length > 10 && !/(Z|[+-]\d\d:?\d\d)$/.test(d) ? `${d}Z` : d).getTime()

function passesSvg(p: NonNullable<(typeof CONTENT)[string]['passes']>) {
  const W = 340, H = 92, L = 8, R = 8
  const t0 = utc(p.from), t1 = utc(p.to)
  const x = (d: string) => L + ((utc(d) - t0) / (t1 - t0)) * (W - L - R)
  const rowY = { NISAR: 30, S1C: 52, S1D: 52 } as const
  const days: string[] = []
  for (let t = t0; t <= t1; t += 86400000) days.push(new Date(t).toISOString().slice(0, 10))
  const ev0 = x(p.event[0]), ev1 = x(p.event[1])
  // hueco sin ninguna pasada que contiene el evento
  const ts = p.list.map((q) => utc(q.date)).sort((a, b) => a - b)
  const evT = utc(p.event[0])
  const before = Math.max(...ts.filter((t) => t <= evT)), after = Math.min(...ts.filter((t) => t > evT))
  const gx0 = x(new Date(before).toISOString()), gx1 = x(new Date(after).toISOString())
  const gapDays = ((after - before) / 86400000).toLocaleString(locale(), { maximumFractionDigits: 1 })
  return `<svg class="passes" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('passes')}">
    <rect x="${gx0}" y="16" width="${gx1 - gx0}" height="48" fill="rgba(239,68,68,0.10)" stroke="rgba(239,68,68,0.5)" stroke-dasharray="3 3"/>
    <text x="${(gx0 + gx1) / 2}" y="12" text-anchor="middle" class="gap">${t('gap')(gapDays)}</text>
    <rect x="${ev0}" y="18" width="${Math.max(3, ev1 - ev0)}" height="44" class="ev"/>
    <text x="4" y="33" class="row">L</text><text x="4" y="55" class="row">C</text>
    ${p.list.map((q) => `<circle cx="${x(q.date)}" cy="${rowY[q.sensor]}" r="3.6" class="${q.sensor === 'NISAR' ? 'nisar' : 's1'}"><title>${q.sensor} · ${q.date.replace('T', ' ')} UTC</title></circle>`).join('')}
    ${days.filter((_, i) => i % 3 === 1).map((d) => `<text x="${x(d)}" y="${H - 6}" text-anchor="middle" class="tick">${fmtDay(d)}</text>`).join('')}
  </svg>`
}
