import { Chart } from 'chart.js'
import type { Manifest } from './types'
import { fmtDay, lang } from './i18n'

const copy = () => lang === 'es' ? {
  title: 'Un territorio, dos escalas de tiempo', loading: 'Cargando precipitación diaria…', missing: 'Precipitación diaria no disponible. El desplazamiento sigue visible; comprueba el archivo de datos o la conexión.',
  note: 'Línea: desplazamiento acumulado LOS (cm), respecto al 25 jun. Barras: precipitación diaria ERA5 (mm/día). Los puntos son adquisiciones; la línea solo los conecta, no representa mediciones intermedias.',
  caution: 'Resultado InSAR preliminar: productos originales y referencia espacial no auditados; el cálculo admite píxeles con pares ausentes. El signo es el convenio del código, pendiente de validación. La coincidencia temporal no demuestra causalidad: pueden intervenir bombeo, acuífero, retardos y otros factores.',
  rain: 'Precipitación estimada ERA5', displacement: 'Desplazamiento LOS preliminar', intervals: 'Intervalos de adquisición', sources: 'Fuentes y limitaciones',
  meta: 'ERA5 vía Open-Meteo: celda 37,5° N, 1,5° O (~25 km); suma diaria local Europe/Madrid, mm. Reanálisis, no pluviómetro: puede suavizar máximos locales. Ninguna fecha se califica de extrema.',
  insar: 'NISAR L2 GUNW declarado, banda L, pasada 159 ascendente; 8 pares, 25 jun–11 oct 2026. Serie: mediana en disco de 0,4 km alrededor de 37,605° N, 1,608° O. Ajuste de plano y altura por escena; sin corrección ionosférica explícita. Sin validación independiente.',
  axisD: 'Desplazamiento LOS (cm)', axisR: 'Precipitación (mm/día)', reference: 'Referencia temporal', obs: 'Adquisición', map: 'Capas semitransparentes: sin color puede significar falta de cobertura o datos filtrados; no equivale a ausencia de movimiento.',
} : {
  title: 'One place, two timescales', loading: 'Loading daily precipitation…', missing: 'Daily precipitation unavailable. Displacement remains visible; check the data file or connection.',
  note: 'Line: cumulative LOS displacement (cm), relative to 25 Jun. Bars: daily ERA5 precipitation (mm/day). Dots are acquisitions; the connecting line is not an observation between them.',
  caution: 'Preliminary InSAR result: original products and spatial reference have not been audited; processing permits pixels with missing pairs. The sign follows the code and needs validation. Timing alone does not establish causation: pumping, aquifer changes, delays and other factors may contribute.',
  rain: 'Estimated ERA5 precipitation', displacement: 'Preliminary LOS displacement', intervals: 'Acquisition intervals', sources: 'Sources and limitations',
  meta: 'ERA5 via Open-Meteo: grid cell 37.5° N, 1.5° W (~25 km); local daily totals, Europe/Madrid, mm. Reanalysis, not a rain gauge: local peaks can be smoothed. No date is classified as extreme.',
  insar: 'Declared NISAR L2 GUNW, L-band, ascending track 159; 8 pairs, 25 Jun–11 Oct 2026. Series: median within 0.4 km of 37.605° N, 1.608° W. Per-scene plane and height fit; no explicit ionospheric correction. No independent validation.',
  axisD: 'LOS displacement (cm)', axisR: 'Precipitation (mm/day)', reference: 'Time reference', obs: 'Acquisition', map: 'Transparent map areas may indicate missing coverage or filtered data; they do not mean there was no movement.',
}

/** Textos del caso Lorca, también para el informe PDF */
export const lorcaCopy = copy

type Rain = { dates: string[]; values: (number | null)[]; unit: string }
export function lorcaHtml(m: Manifest) {
  const s = copy()
  return `<section class="sec lorca-comparison"><div class="label">${s.title}</div><p class="hint">${s.note}</p>
    <div class="chart-box lorca-chart"><canvas id="lorca-chart" role="img" aria-label="${s.axisD}; ${s.axisR}"></canvas></div>
    <p class="hint" id="lorca-rain-status" role="status">${s.loading}</p><p class="hint">${s.caution}</p><p class="hint">${s.map}</p>
    <details class="why"><summary>${s.intervals}</summary><ul>${m.insar!.pairs.map(p => `<li>${fmtDay(p.ref)} → ${fmtDay(p.sec)} · 159 A</li>`).join('')}</ul></details>
    <details class="why"><summary>${s.sources}</summary><p>${s.insar}</p><p>${s.meta}</p><p><a href="https://nisar-docs.asf.alaska.edu/gunw/" target="_blank" rel="noopener">NASA / ASF · GUNW</a> · <a href="https://open-meteo.com/en/docs/historical-weather-api" target="_blank" rel="noopener">Open-Meteo · ERA5</a> · <a href="/data/lorca/rain-era5.json" target="_blank" rel="noopener">ERA5 JSON</a> · <a href="https://www.miteco.gob.es/es/cartografia-y-sig/ide/directorio_datos_servicios/agua.html" target="_blank" rel="noopener">MITECO · SNCZI T100</a> · <a href="/data/lorca/manifest.json" target="_blank" rel="noopener">Manifest</a></p></details></section>`
}

export async function drawLorca(m: Manifest, el: HTMLElement) {
  const canvas = el.querySelector<HTMLCanvasElement>('#lorca-chart')
  if (!canvas || !m.insar) return
  const s = copy(), insar = m.insar
  const start = Date.parse(`${insar.start}T00:00:00Z`), end = Date.parse(`${insar.end}T00:00:00Z`)
  const dates: string[] = []
  for (let d = start; d <= end; d += 86400000) dates.push(new Date(d).toISOString().slice(0, 10))
  let rain: Rain | undefined
  try {
    const response = await fetch('/data/lorca/rain-era5.json')
    if (!response.ok) throw new Error('rain unavailable')
    const data = await response.json() as Rain
    if (data.unit !== 'mm' || !Array.isArray(data.dates) || !Array.isArray(data.values) || data.dates.length !== data.values.length || data.dates.some((d, i) => d !== dates[i]) || data.dates.length !== dates.length || data.values.some(v => v !== null && (typeof v !== 'number' || !Number.isFinite(v) || v < 0))) throw new Error('invalid rain')
    rain = data.values.some(v => v !== null) ? data : undefined
  } catch { /* show available displacement and an explicit status */ }
  if (!canvas.isConnected) return
  const status = el.querySelector<HTMLElement>('#lorca-rain-status')!
  status.textContent = rain ? s.meta + (rain.values.some(v => v === null) ? (lang === 'es' ? ' Hay días sin observaciones.' : ' Some days have no observations.') : '') : s.missing
  const values = new Map(m.series.dates.map((date, i) => [date, m.series.hh[i]]))
  values.set(insar.start, 0)
  Chart.getChart(canvas)?.destroy()
  new Chart(canvas, {
    type: 'bar',
    data: { labels: dates, datasets: [
      { type: 'line', label: s.displacement, data: dates.map(d => values.get(d) ?? null), yAxisID: 'displacement', spanGaps: true, borderColor: '#f3af64', backgroundColor: '#f3af64', pointRadius: 3, borderWidth: 2, tension: 0, order: 0 },
      { type: 'bar', label: s.rain, data: rain?.values ?? dates.map(() => null), yAxisID: 'rain', backgroundColor: '#5cb8f2', order: 1 },
    ] },
    options: { responsive: true, maintainAspectRatio: false, animation: false,
      plugins: { tooltip: { callbacks: { title: items => fmtDay(dates[items[0].dataIndex], { day: 'numeric', month: 'short', year: 'numeric' }), label: item => `${item.dataset.label}: ${item.parsed.y} ${item.datasetIndex === 0 ? 'cm' : 'mm'}` } } },
      scales: { x: { ticks: { color: '#aeb8c9', maxTicksLimit: 5, maxRotation: 0, callback: function(value) { return fmtDay(dates[Number(value)]) } }, grid: { display: false } },
        displacement: { position: 'left', title: { display: true, text: s.axisD, color: '#f3af64' }, ticks: { color: '#f3af64' }, grid: { color: 'rgba(255,255,255,.08)' } },
        rain: { position: 'right', beginAtZero: true, title: { display: true, text: s.axisR, color: '#5cb8f2' }, ticks: { color: '#5cb8f2' }, grid: { drawOnChartArea: false } } } },
  })
}
