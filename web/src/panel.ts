import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler } from 'chart.js'
import type { DetailView, ViewMode, Pol } from './detail'
import type { Manifest } from './types'
import { CONTENT, KIND_META } from './content'
import { t, locale, metricLabel } from './i18n'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler)

const fmtDate = (d: string) => new Date(d).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' })
const fmtNum = (v: number) => v.toLocaleString(locale(), { maximumFractionDigits: Math.abs(v) >= 1000 ? 0 : 1 })

export class Panel {
  private el: HTMLElement
  private chart?: Chart
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
    }

    this.el.style.setProperty('--accent', meta.color)
    this.el.innerHTML = `
      <div class="p-head">
        <div class="kicker">${meta.icon} ${meta.label} · ${c.dateLabel}</div>
        <h2>${c.headline}</h2>
        <div class="place">${c.place}</div>
        ${m.mock ? `<div class="mock">${t('mock')}</div>` : ''}
      </div>
      <p class="summary">${c.summary}</p>
      ${c.passes ? `<section class="card"><div class="label">${t('passes')}</div>${passesSvg(c.passes)}<div class="legend"><span><i class="nisar"></i>${t('legendL')}</span><span><i class="s1"></i>${t('legendC')}</span><span><i class="ev"></i>${t('legendEv')}</span></div></section>` : ''}

      <section class="card controls">
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
          ${m.overlays.effis ? `<label class="toggle"><input type="checkbox" id="chk-ref" ${v.showRef ? 'checked' : ''} /> <span>${t('effis')}</span></label>` : ''}
        </div>
        <div class="timeline" id="timeline">
          <button id="play" class="btn icon" aria-label="Reproducir">▶</button>
          <input type="range" id="frame" min="0" max="${v.frames.length - 1}" step="1" />
          <span id="frame-date" class="mono"></span>
        </div>
        <label class="opacity"><span>${t('opacity')}</span><input type="range" id="opacity" min="0" max="1" step="0.05" value="${v.sarOpacity}" /></label>
        <p class="hint" id="mode-hint"></p>
      </section>

      <section class="metrics">
        ${m.metrics.map((x) => `<div class="metric"><b>${fmtNum(x.value)}<small> ${x.unit}</small></b><span>${metricLabel(x.id, m.kind, x.label)}</span></div>`).join('')}
      </section>

      <section class="card">
        <div class="label">${t('chart')}</div>
        <div class="chart-box"><canvas id="chart"></canvas></div>
      </section>

      <section>
        <div class="label">${t('why')}</div>
        ${c.why.map((w) => `<details class="why"><summary>${w.title}</summary><p>${w.text}</p></details>`).join('')}
      </section>

      <section>
        <div class="label">${t('who')}</div>
        <div class="who">${c.who.map((w) => `<div><b>${w.title}</b><span>${w.text}</span></div>`).join('')}</div>
      </section>

      <footer class="src">
        ${t('source')(m.frames[0]?.track ?? 0, fmtDate(m.pair.before), fmtDate(m.pair.after), !!m.s1)}
      </footer>
    `
    this.bind(m)
    this.sync()
    this.drawChart(m)
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
    this.el.querySelector('#play')!.textContent = '❚❚'
    this.timer = window.setInterval(() => v.setFrame(v.frameIdx + 1), 900)
  }

  stop() {
    clearInterval(this.timer)
    this.timer = 0
    const b = this.el.querySelector('#play')
    if (b) b.textContent = '▶'
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

  private drawChart(m: Manifest) {
    this.chart?.destroy()
    const accent = KIND_META[m.kind].color
    const ctx = this.el.querySelector<HTMLCanvasElement>('#chart')!
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: m.series.dates.map((d) => new Date(d).toLocaleDateString(locale(), { day: 'numeric', month: 'short' })),
        datasets: [
          { label: 'HH', data: m.series.hh, borderColor: m.kind === 'flood' ? accent : '#94a3b8', backgroundColor: 'transparent', tension: 0.3, pointRadius: 2.5, borderWidth: 2 },
          { label: 'HV', data: m.series.hv, borderColor: m.kind === 'fire' ? accent : '#94a3b8', backgroundColor: 'transparent', tension: 0.3, pointRadius: 2.5, borderWidth: 2, borderDash: m.kind === 'flood' ? [4, 4] : [] },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${(c.parsed.y ?? 0).toFixed(1)} dB` } } },
        scales: {
          x: { ticks: { color: '#7c8aa5', font: { size: 10 }, maxRotation: 0, autoSkipPadding: 12 }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { ticks: { color: '#7c8aa5', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.06)' } },
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
              g.font = '10px JetBrains Mono'
              g.fillText(n.label.toUpperCase(), x + 4, ch.chartArea.top + 10)
              g.restore()
            }
          },
        },
      ],
    })
  }
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
