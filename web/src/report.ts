// Informe PDF de un incidente (o de todos): ficha, cifras clave, mapas sobre imagen de satélite,
// imágenes de radar, gráficos, índice de riesgo, textos del caso y fuentes.
// Se genera en el navegador a partir del manifest de cada caso (public/data/<id>/manifest.json,
// salida del pipeline) y de los textos de content.ts. Este módulo se carga bajo demanda (import()).
import { jsPDF } from 'jspdf'
import { Chart, LineController, LineElement, PointElement, BarController, BarElement, LinearScale, CategoryScale, Filler, type ChartConfiguration, type Plugin } from 'chart.js'
import type { Frame, Kind, Manifest } from './types'
import { CONTENT, KIND_META } from './content'
import { hazardMeta } from './hazards'
import { t, lang, locale, fmtDay, fmtDec } from './i18n'
import { RISK_COLORS } from './detail'
import { LC_COLORS, exposureText, maskLabel, metricName, riskTexts, sourceLine, topDriver, unitLabel, visibleMetrics } from './panel'
import { lorcaCopy } from './lorca'

Chart.register(LineController, LineElement, PointElement, BarController, BarElement, LinearScale, CategoryScale, Filler)

// ---------- estilo de página (A4, mm) ----------
const PAGE_W = 210
const PAGE_H = 297
const MX = 16
const TOP = 20
const BOTTOM = 20
const CW = PAGE_W - 2 * MX
const PT = 0.3528 // mm por punto tipográfico
const INK = '#141922'
const MUTED = '#5d6677'
const FAINT = '#8a93a3'
const LINE = '#dde2ea'
const SOFT = '#f4f6f9'
const FONT = 'Helvetica, Arial, sans-serif'
/** Colores de cada tipo de riesgo, más oscuros que los de la web (fondo blanco) */
const PRINT: Record<Kind, string> = { flood: '#1f78c1', fire: '#d9591a', earthquake: '#c2387f', landslide: '#4f7f0e', volcano: '#c62828', subsidence: '#7c43c4' }
const ESRI = (z: number, x: number, y: number) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`

const copy = () =>
  lang === 'es'
    ? {
        kicker: 'NISEarth · Informe de incidente',
        allTitle: 'Informe de incidentes',
        allSub: 'Todos los incidentes registrados en NISEarth, con sus datos, mapas, imágenes de radar y gráficos.',
        contents: 'Contenido',
        generated: (d: string) => `Generado el ${d} desde ${location.host}`,
        overview: 'Ficha del incidente',
        fIncident: 'Incidente', fKind: 'Tipo', fPlace: 'Lugar', fRegion: 'Región', fEvent: 'Fecha del evento', fDates: 'Fechas',
        fPair: 'Par NISAR antes / después', fPeriod: 'Periodo InSAR', fTracks: 'Pasadas (track)', fAcq: 'Adquisiciones NISAR',
        fCenter: 'Centro', fBbox: 'Zona de estudio', fSize: 'Tamaño aproximado', fSensors: 'Sensores', fFirms: 'Focos FIRMS',
        regionEs: 'España', regionWorld: 'NISAR en el mundo',
        firmsRow: (n: string, a: string, b: string, p: number) => `${n} focos entre el ${a} y el ${b}; el ${p} % dentro de la máscara del radar`,
        metrics: 'Cifras clave',
        map: 'Mapa de situación',
        mapCap: 'Fondo: Esri World Imagery (© Esri, Maxar, Earthstar Geographics). Capas calculadas por el pipeline de NISEarth.',
        noBase: 'Sin fondo de satélite (no se pudo descargar).',
        hotspot: 'Punto de la serie temporal',
        firmsDots: 'Focos NASA FIRMS (amarillo = primer día, rojo = último)',
        radar: 'Imágenes de radar NISAR',
        radarCap: (pol: string) => `Retrodispersión ${pol} sobre la zona de estudio. Más claro = más señal devuelta al satélite.`,
        change: 'Cambio entre las dos pasadas',
        movement: 'Movimiento total (desplazamiento LOS)',
        fringes: 'Franjas del último interferograma',
        coherence: 'Coherencia del último interferograma',
        series: 'Todas las adquisiciones',
        charts: 'Gráficos',
        s1: 'Banda L (NISAR) frente a banda C (Sentinel-1)',
        s1L: 'NISAR · banda L (24 cm)', s1C: 'Sentinel-1 · banda C (5,5 cm)',
        copol: 'Copolar (HH / VV)', xpol: 'Cruzada (HV / VH)',
        s1Chart: 'Cambio medio de la señal dentro de la máscara (dB)',
        s1Change: (s: string) => `Cambio ${s}`,
        insar: 'Interferometría (InSAR)',
        iProduct: 'Producto', iMode: 'Modo', iPairs: 'pares independientes', iChain: 'cadena acumulada', iWl: 'Longitud de onda',
        iScale: 'Escala de color', iFringe: 'Una franja de color', iNoise: 'Ruido de fondo (desv. típica)', iThr: 'Umbral de detección',
        iRate: 'Velocidad (ajuste lineal)', iDays: 'Días cubiertos', iDetrend: 'Corrección aplicada', iSeries: 'Serie temporal', iHot: 'Punto de la serie',
        detrend: { ramp: 'rampa (órbita, ionosfera) y relieve estimados en la escena', offset: 'solo el cero, fijado en el campo lejano', x_dem: 'rampa y relieve (Copernicus DEM)' } as Record<string, string>,
        seriesPoint: 'disco alrededor del punto', seriesRegion: 'zona menos un anillo de 1 km',
        pairsT: 'Interferogramas', hRef: 'Primera pasada', hSec: 'Segunda pasada', hTrack: 'Pasada', hDir: 'Sentido', asc: 'Ascendente', desc: 'Descendente',
        acq: 'Adquisiciones', hDate: 'Fecha', hWhen: 'Respecto al evento',
        quakes: 'Terremotos registrados (EMSC)', hTime: 'Fecha (UTC)', hMag: 'Magnitud', hDepth: 'Profundidad', hPlace: 'Lugar',
        quakesNote: (n: number, k: number) => `${n} terremotos en la zona; se muestran los ${k} mayores.`,
        hCover: 'Cobertura', hHa: 'Hectáreas', hPct: '%', outsideRef: 'Fuera de la referencia oficial',
        riskMap: 'Mapa del índice de riesgo', hClass: 'Clase', hCells: 'Celdas', hPeople: 'Personas', hIndex: 'Índice', hCoords: 'Coordenadas',
        rExpected: 'Población esperada (ponderada por riesgo)', rRoads: 'Carreteras en riesgo alto', rRail: 'Vía férrea en riesgo alto',
        rCritical: 'Instalaciones críticas en riesgo alto', rWeights: 'Pesos', rModel: 'Modelo', rGenerated: 'Calculado', rSources: 'Fuentes del índice',
        t100: 'Escenario de inundabilidad T100 (SNCZI)',
        t100Cap: 'Desplazamiento LOS con el escenario fluvial T100 del SNCZI superpuesto (violeta). Es cartografía modelada, no una inundación observada; la ausencia de color no descarta riesgo.',
        how: 'Cómo lo ve el radar',
        stats: 'Parámetros técnicos del procesado',
        sources: 'Fuentes y datos',
        files: 'Datos abiertos de este caso',
        disclaimer: 'Prototipo de NASA Space Apps 2026 (Dancing with the SARs). Resultados exploratorios a partir de datos abiertos: no sustituyen a los productos oficiales de emergencia.',
        missing: 'Imagen no disponible',
        partial: 'No se pudieron incluir todos los datos de este incidente.',
        lorcaRain: 'Precipitación diaria ERA5 (mm)',
        footer: 'NISEarth · lo que vio el radar · NASA Space Apps 2026',
      }
    : {
        kicker: 'NISEarth · Incident report',
        allTitle: 'Incident report',
        allSub: 'Every incident in NISEarth, with its data, maps, radar images and charts.',
        contents: 'Contents',
        generated: (d: string) => `Generated on ${d} from ${location.host}`,
        overview: 'Incident overview',
        fIncident: 'Incident', fKind: 'Type', fPlace: 'Place', fRegion: 'Region', fEvent: 'Event date', fDates: 'Dates',
        fPair: 'NISAR before / after pair', fPeriod: 'InSAR period', fTracks: 'Tracks', fAcq: 'NISAR acquisitions',
        fCenter: 'Centre', fBbox: 'Study area', fSize: 'Approximate size', fSensors: 'Sensors', fFirms: 'FIRMS hotspots',
        regionEs: 'Spain', regionWorld: 'NISAR around the world',
        firmsRow: (n: string, a: string, b: string, p: number) => `${n} hotspots between ${a} and ${b}; ${p}% inside the radar mask`,
        metrics: 'Key figures',
        map: 'Situation map',
        mapCap: 'Background: Esri World Imagery (© Esri, Maxar, Earthstar Geographics). Layers computed by the NISEarth pipeline.',
        noBase: 'No satellite background (download failed).',
        hotspot: 'Time-series point',
        firmsDots: 'NASA FIRMS hotspots (yellow = first day, red = last)',
        radar: 'NISAR radar images',
        radarCap: (pol: string) => `${pol} backscatter over the study area. Brighter = more signal returned to the satellite.`,
        change: 'Change between the two passes',
        movement: 'Total motion (LOS displacement)',
        fringes: 'Fringes of the last interferogram',
        coherence: 'Coherence of the last interferogram',
        series: 'Every acquisition',
        charts: 'Charts',
        s1: 'L-band (NISAR) vs C-band (Sentinel-1)',
        s1L: 'NISAR · L-band (24 cm)', s1C: 'Sentinel-1 · C-band (5.5 cm)',
        copol: 'Co-pol (HH / VV)', xpol: 'Cross-pol (HV / VH)',
        s1Chart: 'Mean signal change inside the mask (dB)',
        s1Change: (s: string) => `${s} change`,
        insar: 'Interferometry (InSAR)',
        iProduct: 'Product', iMode: 'Mode', iPairs: 'independent pairs', iChain: 'cumulative chain', iWl: 'Wavelength',
        iScale: 'Colour scale', iFringe: 'One colour fringe', iNoise: 'Background noise (std. dev.)', iThr: 'Detection threshold',
        iRate: 'Rate (linear fit)', iDays: 'Days covered', iDetrend: 'Correction applied', iSeries: 'Time series', iHot: 'Series point',
        detrend: { ramp: 'ramp (orbit, ionosphere) and topography estimated in the scene', offset: 'zero only, set in the far field', x_dem: 'ramp and topography (Copernicus DEM)' } as Record<string, string>,
        seriesPoint: 'disc around the point', seriesRegion: 'area minus a 1 km ring',
        pairsT: 'Interferograms', hRef: 'First pass', hSec: 'Second pass', hTrack: 'Track', hDir: 'Direction', asc: 'Ascending', desc: 'Descending',
        acq: 'Acquisitions', hDate: 'Date', hWhen: 'Relative to the event',
        quakes: 'Recorded earthquakes (EMSC)', hTime: 'Date (UTC)', hMag: 'Magnitude', hDepth: 'Depth', hPlace: 'Place',
        quakesNote: (n: number, k: number) => `${n} earthquakes in the area; the ${k} largest are listed.`,
        hCover: 'Land cover', hHa: 'Hectares', hPct: '%', outsideRef: 'Outside the official reference',
        riskMap: 'Risk index map', hClass: 'Class', hCells: 'Cells', hPeople: 'People', hIndex: 'Index', hCoords: 'Coordinates',
        rExpected: 'Expected population (risk-weighted)', rRoads: 'Roads at high risk', rRail: 'Railway at high risk',
        rCritical: 'Critical facilities at high risk', rWeights: 'Weights', rModel: 'Model', rGenerated: 'Computed', rSources: 'Index sources',
        t100: 'T100 flood hazard scenario (SNCZI)',
        t100Cap: 'LOS displacement with the SNCZI T100 river flood scenario overlaid (purple). This is modelled hazard mapping, not an observed flood; no colour does not rule out risk.',
        how: 'How radar sees it',
        stats: 'Processing parameters',
        sources: 'Sources and data',
        files: 'Open data for this case',
        disclaimer: 'NASA Space Apps 2026 prototype (Dancing with the SARs). Exploratory results from open data: they do not replace official emergency products.',
        missing: 'Image not available',
        partial: 'Not all the data for this incident could be included.',
        lorcaRain: 'Daily ERA5 precipitation (mm)',
        footer: 'NISEarth · what the radar saw · NASA Space Apps 2026',
      }
type Copy = ReturnType<typeof copy>

// ---------- texto ----------
/** Texto plano apto para las fuentes estándar del PDF (Latin-1): sin HTML y con sustitutos para los símbolos que faltan */
const SUBS: Record<string, string> = {
  '−': '-', '–': '-', '—': ' - ', '‑': '-', '‘': "'", '’': "'", '“': '"', '”': '"', '…': '...', '→': '->', '←': '<-',
  '↑': '^', '↓': 'v', '≈': '~', '≠': '!=', '≤': '<=', '≥': '>=', '•': '·', 'Δ': 'd', 'σ': 's', ' ': ' ', ' ': ' ', ' ': ' ', ' ': ' ',
}
const parser = new DOMParser()
function clean(s: unknown): string {
  if (s === null || s === undefined) return ''
  let txt = String(s)
  // DOMParser no ejecuta scripts ni carga imágenes: sirve para quitar etiquetas y entidades
  if (/[<&]/.test(txt)) txt = parser.parseFromString(`<body>${txt}</body>`, 'text/html').body.textContent ?? ''
  return txt.normalize('NFC').replace(/\s+/g, ' ').trim().replace(/[^\x00-\xff]/g, (c) => SUBS[c] ?? '')
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
// los manifests no traen siempre los mismos campos: un valor ausente se escribe como «-», nunca como «NaN»
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const fmtInt = (v: unknown) => (num(v) ? v.toLocaleString(locale(), { maximumFractionDigits: 0 }) : '-')
const fmtNum = (v: unknown) => (num(v) ? v.toLocaleString(locale(), { maximumFractionDigits: Math.abs(v) >= 1000 ? 0 : 1 }) : '-')
const dec = (v: unknown, d = 2) => (num(v) ? fmtDec(v, d) : '-')
const fmtDate = (d: string) => fmtDay(d, { day: 'numeric', month: 'short', year: 'numeric' })
const fmtLatLon = (lon: number, lat: number) =>
  `${Math.abs(lat).toFixed(3)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(3)}° ${lon >= 0 ? 'E' : lang === 'es' ? 'O' : 'W'}`

// ---------- color ----------
const rgb = (hex: string) => {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
}
const toHex = (c: number[]) => `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`
/** Mezcla con blanco (k = 0 color puro, 1 blanco): el PDF no usa transparencias */
const tint = (hex: string, k: number) => toHex(rgb(hex).map((v) => v + (255 - v) * k))
const lerpColor = (a: string, b: string, k: number) => {
  const ca = rgb(a), cb = rgb(b)
  return toHex(ca.map((v, i) => v + (cb[i] - v) * k))
}
const alpha = (hex: string, a: number) => `rgba(${rgb(hex).join(',')},${a})`

// ---------- recursos (con caché durante una exportación) ----------
const imgCache = new Map<string, Promise<HTMLImageElement | null>>()
function loadImage(url: string, timeout = 15000): Promise<HTMLImageElement | null> {
  const hit = imgCache.get(url)
  if (hit) return hit
  const p = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    const timer = window.setTimeout(() => resolve(null), timeout)
    img.onload = () => (clearTimeout(timer), resolve(img))
    img.onerror = () => (clearTimeout(timer), resolve(null))
    img.src = url
  })
  imgCache.set(url, p)
  return p
}
async function getJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url)
    if (!r.ok) return null
    return (await r.json()) as T
  } catch {
    return null
  }
}

interface Pic {
  url: string
  w: number
  h: number
}

// ---------- mapas: teselas Esri + capas del caso, dibujadas en un canvas ----------
type Pos = number[]
type Geometry =
  | { type: 'Point'; coordinates: Pos }
  | { type: 'MultiPoint' | 'LineString'; coordinates: Pos[] }
  | { type: 'MultiLineString' | 'Polygon'; coordinates: Pos[][] }
  | { type: 'MultiPolygon'; coordinates: Pos[][][] }
interface Feature {
  geometry: Geometry | null
  properties: Record<string, unknown> | null
}
interface FC {
  features: Feature[]
}

const wx = (lon: number, z: number) => ((lon + 180) / 360) * 256 * 2 ** z
const wy = (lat: number, z: number) => {
  const s = Math.sin((Math.max(-85, Math.min(85, lat)) * Math.PI) / 180)
  return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * 256 * 2 ** z
}

interface MapFrame {
  z: number
  x0: number
  y0: number
  w: number
  h: number
  lat: number
}
/** Zoom de teselas para que la zona de estudio mida al menos `target` píxeles en su lado mayor */
function mapFrame(m: Manifest, target = 1100): MapFrame {
  const [w, s, e, n] = m.bbox
  let z = 1
  while (z < 17 && Math.max(wx(e, z) - wx(w, z), wy(s, z) - wy(n, z)) < target) z++
  return { z, x0: wx(w, z), y0: wy(n, z), w: wx(e, z) - wx(w, z), h: wy(s, z) - wy(n, z), lat: (s + n) / 2 }
}

interface Raster {
  url: string
  alpha?: number
}
interface Drawn {
  ctx: CanvasRenderingContext2D
  /** lon/lat → píxel del canvas */
  P: (lon: number, lat: number) => [number, number]
  /** unidad de dibujo: 1 px de un mapa de 900 px de ancho */
  u: number
}

async function renderMap(m: Manifest, f: MapFrame, outPx: number, rasters: Raster[], draw?: (d: Drawn) => void): Promise<(Pic & { base: boolean }) | null> {
  const k = outPx / Math.max(f.w, f.h)
  const W = Math.max(1, Math.round(f.w * k)), H = Math.max(1, Math.round(f.h * k))
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = '#1d232c'
  ctx.fillRect(0, 0, W, H)
  // teselas de fondo
  const n = 2 ** f.z
  const tx0 = Math.floor(f.x0 / 256), tx1 = Math.floor((f.x0 + f.w - 1) / 256)
  const ty0 = Math.max(0, Math.floor(f.y0 / 256)), ty1 = Math.min(n - 1, Math.floor((f.y0 + f.h - 1) / 256))
  const jobs: Promise<void>[] = []
  let ok = 0
  if ('filter' in ctx) ctx.filter = 'saturate(0.65) brightness(0.92)'
  for (let tx = tx0; tx <= tx1; tx++)
    for (let ty = ty0; ty <= ty1; ty++)
      jobs.push(
        loadImage(ESRI(f.z, ((tx % n) + n) % n, ty), 12000).then((img) => {
          if (!img) return
          ok++
          ctx.drawImage(img, (tx * 256 - f.x0) * k, (ty * 256 - f.y0) * k, 256 * k + 0.6, 256 * k + 0.6)
        }),
      )
  await Promise.all(jobs)
  if ('filter' in ctx) ctx.filter = 'none'
  const P = (lon: number, lat: number): [number, number] => [(wx(lon, f.z) - f.x0) * k, (wy(lat, f.z) - f.y0) * k]
  // rásteres del pipeline (mismas cuatro esquinas que en el mapa de la web)
  const [tl, , br] = m.coordinates
  for (const r of rasters) {
    const img = await loadImage(r.url)
    if (!img) continue
    const [ax, ay] = P(tl[0], tl[1]), [bx, by] = P(br[0], br[1])
    ctx.globalAlpha = r.alpha ?? 0.9
    ctx.drawImage(img, ax, ay, bx - ax, by - ay)
    ctx.globalAlpha = 1
  }
  const u = W / 900
  draw?.({ ctx, P, u })
  // barra de escala
  const mpp = (40075016.686 * Math.cos((f.lat * Math.PI) / 180)) / (256 * n) / k
  const want = W * 0.18 * mpp
  const pow = 10 ** Math.floor(Math.log10(want))
  const nice = [5, 2, 1].map((s) => s * pow).find((v) => v <= want) ?? pow
  const bar = nice / mpp
  const fs = Math.max(11, Math.round(13 * u))
  ctx.font = `600 ${fs}px ${FONT}`
  const label = nice >= 1000 ? `${fmtNum(nice / 1000)} km` : `${fmtInt(nice)} m`
  const pad = 8 * u, bx = 12 * u, by = H - 14 * u
  ctx.fillStyle = 'rgba(255,255,255,0.82)'
  ctx.fillRect(bx - pad, by - fs - 10 * u, bar + 2 * pad, fs + 18 * u)
  ctx.fillStyle = '#141922'
  ctx.fillRect(bx, by - 3 * u, bar, 4 * u)
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(label, bx, by - 7 * u)
  // atribución
  const attr = '© Esri, Maxar, Earthstar Geographics'
  ctx.font = `${Math.max(9, Math.round(10.5 * u))}px ${FONT}`
  const aw = ctx.measureText(attr).width
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.fillRect(W - aw - 14 * u, H - 18 * u, aw + 14 * u, 18 * u)
  ctx.fillStyle = '#333'
  ctx.fillText(attr, W - aw - 7 * u, H - 5.5 * u)
  try {
    return { url: canvas.toDataURL('image/jpeg', 0.8), w: W, h: H, base: ok > 0 }
  } catch {
    return null // canvas contaminado: no debería ocurrir (todas las imágenes piden CORS)
  }
}

/** Recorre una geometría GeoJSON y la añade al trazado actual del canvas */
function tracePath(ctx: CanvasRenderingContext2D, g: Geometry, P: Drawn['P']) {
  const ring = (cs: Pos[], close: boolean) => {
    cs.forEach((c, i) => {
      const [x, y] = P(c[0], c[1])
      if (i) ctx.lineTo(x, y)
      else ctx.moveTo(x, y)
    })
    if (close) ctx.closePath()
  }
  if (g.type === 'LineString') ring(g.coordinates, false)
  else if (g.type === 'MultiLineString') g.coordinates.forEach((l) => ring(l, false))
  else if (g.type === 'Polygon') g.coordinates.forEach((r) => ring(r, true))
  else if (g.type === 'MultiPolygon') g.coordinates.forEach((p) => p.forEach((r) => ring(r, true)))
}
const points = (g: Geometry): Pos[] => (g.type === 'Point' ? [g.coordinates] : g.type === 'MultiPoint' ? g.coordinates : [])

/** Imagen local (radar, foto oficial) a JPEG, limitada en tamaño */
async function picture(url: string, maxPx = 1400): Promise<Pic | null> {
  const img = await loadImage(url)
  if (!img || !img.naturalWidth) return null
  const k = Math.min(1, maxPx / Math.max(img.naturalWidth, img.naturalHeight))
  const c = document.createElement('canvas')
  c.width = Math.round(img.naturalWidth * k)
  c.height = Math.round(img.naturalHeight * k)
  const ctx = c.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.drawImage(img, 0, 0, c.width, c.height)
  try {
    return { url: c.toDataURL('image/jpeg', 0.86), w: c.width, h: c.height }
  } catch {
    return null
  }
}

// ---------- gráficos: Chart.js en un canvas fuera de pantalla, tema claro ----------
const tick = { color: '#4b5563', font: { family: FONT, size: 12 } }
const grid = { color: '#e6e9ef' }
async function chartPic(cfg: ChartConfiguration, w = 900, h = 330): Promise<Pic | null> {
  const holder = document.createElement('div')
  holder.style.cssText = `position:fixed;left:-20000px;top:0;width:${w}px;height:${h}px;pointer-events:none`
  const c = document.createElement('canvas')
  c.style.width = `${w}px`
  c.style.height = `${h}px`
  c.width = w
  c.height = h
  holder.append(c)
  document.body.append(holder)
  let chart: Chart | undefined
  try {
    const white: Plugin = { id: 'white', beforeDraw: (ch) => { const g = ch.ctx; g.save(); g.fillStyle = '#fff'; g.fillRect(0, 0, ch.width, ch.height); g.restore() } }
    chart = new Chart(c, { ...cfg, options: { ...cfg.options, responsive: false, animation: false, devicePixelRatio: 2, events: [] }, plugins: [white, ...(cfg.plugins ?? [])] })
    return { url: c.toDataURL('image/png'), w, h }
  } catch (e) {
    console.error('[report] chart', e)
    return null
  } finally {
    chart?.destroy()
    holder.remove()
  }
}

/** Línea vertical discontinua con etiqueta en un gráfico */
function vmark(ch: Chart, x: number, color: string, label: string, right = false) {
  const g = ch.ctx
  g.save()
  g.strokeStyle = color
  g.setLineDash([4, 4])
  g.beginPath()
  g.moveTo(x, ch.chartArea.top)
  g.lineTo(x, ch.chartArea.bottom)
  g.stroke()
  g.fillStyle = color
  g.font = `600 11px ${FONT}`
  g.textAlign = right ? 'right' : 'left'
  g.fillText(label, x + (right ? -5 : 5), ch.chartArea.top + 12)
  g.restore()
}

function seriesChart(m: Manifest, accent: string) {
  if (m.insar) {
    const ins = m.insar
    const pairs = ins.mode === 'pairs'
    const labels = pairs ? m.frames.map((f) => `T${f.track} ${f.dir ?? ''} ${fmtDay(f.ref ?? f.date)}-${fmtDay(f.date)}`) : [fmtDay(ins.start), ...m.series.dates.map((d) => fmtDay(d))]
    const data = pairs ? m.series.hh : [0, ...m.series.hh]
    const noise = ins.noise_cm
    const band: Plugin = {
      id: 'noise',
      beforeDatasetsDraw: (ch) => {
        const g = ch.ctx, y = ch.scales.y, a = ch.chartArea
        g.save()
        g.fillStyle = 'rgba(100,116,139,0.14)'
        g.fillRect(a.left, y.getPixelForValue(noise), a.right - a.left, y.getPixelForValue(-noise) - y.getPixelForValue(noise))
        g.restore()
      },
    }
    return chartPic({
      type: pairs ? 'bar' : 'line',
      data: { labels, datasets: [{ label: 'cm', data, borderColor: accent, backgroundColor: pairs ? accent : 'transparent', tension: 0.25, pointRadius: 3, borderWidth: 2.5, maxBarThickness: 46, borderRadius: 2 }] },
      options: {
        scales: {
          x: { ticks: { ...tick, maxRotation: 0, autoSkipPadding: 12 }, grid },
          y: { suggestedMin: -Math.max(2, noise * 2), suggestedMax: Math.max(2, noise * 2) * (pairs ? 1 : 0.3), ticks: tick, grid, title: { display: true, text: 'cm', ...tick } },
        },
      },
      plugins: [band],
    })
  }
  const notes = CONTENT[m.id]?.notes ?? []
  const dates = m.series.dates
  const marks: Plugin = {
    id: 'notes',
    afterDraw: (ch) => {
      for (const n of notes) {
        const j = dates.findIndex((d) => d >= n.date)
        if (j < 0) continue
        const tm = (i: number) => new Date(dates[i]).getTime()
        const xj = ch.scales.x.getPixelForValue(j)
        const x = j === 0 ? xj : ch.scales.x.getPixelForValue(j - 1) + ((xj - ch.scales.x.getPixelForValue(j - 1)) * (new Date(n.date).getTime() - tm(j - 1))) / (tm(j) - tm(j - 1))
        vmark(ch, x, accent, clean(n.label).toUpperCase())
      }
    },
  }
  return chartPic({
    type: 'line',
    data: {
      labels: dates.map((d) => fmtDay(d)),
      datasets: [
        { label: 'HH', data: m.series.hh, borderColor: m.kind === 'fire' ? '#7b8494' : accent, backgroundColor: 'transparent', tension: 0.3, pointRadius: 3, borderWidth: 2.5 },
        { label: 'HV', data: m.series.hv, borderColor: m.kind === 'fire' ? accent : '#7b8494', backgroundColor: 'transparent', tension: 0.3, pointRadius: 3, borderWidth: 2.5, borderDash: m.kind === 'flood' ? [5, 5] : [] },
      ],
    },
    options: { scales: { x: { ticks: { ...tick, maxRotation: 0, autoSkipPadding: 14 }, grid }, y: { ticks: tick, grid, title: { display: true, text: 'dB', ...tick } } } },
    plugins: [marks],
  })
}

function dailyChart(m: Manifest) {
  const d = m.daily!
  const rain = d.kind === 'rain'
  const color = rain ? '#2f8fd8' : '#e8701f'
  const marks = rain ? [m.pair.before, m.pair.after] : []
  return chartPic({
    type: 'bar',
    data: { labels: d.dates.map((x) => fmtDay(x)), datasets: [{ data: d.values, backgroundColor: d.dates.map((x) => (marks.includes(x) ? '#9aa3b2' : color)), borderRadius: 2, maxBarThickness: 22 }] },
    options: { scales: { x: { ticks: { ...tick, maxRotation: 0, autoSkipPadding: 12 }, grid: { display: false } }, y: { beginAtZero: true, ticks: tick, grid, title: { display: true, text: rain ? 'mm' : t('hotspots'), ...tick } } } },
    plugins: [{
      id: 'passes',
      afterDraw: (ch) => {
        for (const date of marks) {
          const j = d.dates.indexOf(date)
          if (j >= 0) vmark(ch, ch.scales.x.getPixelForValue(j), '#374151', 'NISAR', j >= d.dates.length / 2)
        }
      },
    }],
  })
}

/** Lorca: desplazamiento acumulado + lluvia diaria ERA5 en dos ejes */
async function lorcaChart(m: Manifest) {
  const ins = m.insar!
  const s = lorcaCopy()
  const start = Date.parse(`${ins.start}T00:00:00Z`), end = Date.parse(`${ins.end}T00:00:00Z`)
  const dates: string[] = []
  for (let d = start; d <= end; d += 86400000) dates.push(new Date(d).toISOString().slice(0, 10))
  const rain = await getJson<{ dates: string[]; values: (number | null)[]; unit: string }>(`/data/${m.id}/rain-era5.json`)
  const rainOk = !!rain && rain.unit === 'mm' && Array.isArray(rain.values) && rain.dates?.length === dates.length && rain.dates.every((d, i) => d === dates[i])
  const values = new Map(m.series.dates.map((date, i) => [date, m.series.hh[i]]))
  values.set(ins.start, 0)
  const pic = await chartPic({
    type: 'bar',
    data: {
      labels: dates.map((d) => fmtDay(d)),
      datasets: [
        { type: 'line', label: s.displacement, data: dates.map((d) => values.get(d) ?? null), yAxisID: 'd', spanGaps: true, borderColor: '#d9822b', backgroundColor: '#d9822b', pointRadius: 3.5, borderWidth: 2.5, tension: 0, order: 0 },
        { type: 'bar', label: s.rain, data: rainOk ? rain!.values : dates.map(() => null), yAxisID: 'r', backgroundColor: '#2f8fd8', order: 1 },
      ],
    },
    options: {
      scales: {
        x: { ticks: { ...tick, maxTicksLimit: 8, maxRotation: 0 }, grid: { display: false } },
        d: { position: 'left', title: { display: true, text: s.axisD, ...tick, color: '#b8661a' }, ticks: { ...tick, color: '#b8661a' }, grid },
        r: { position: 'right', beginAtZero: true, title: { display: true, text: s.axisR, ...tick, color: '#1f6fb0' }, ticks: { ...tick, color: '#1f6fb0' }, grid: { drawOnChartArea: false } },
      },
    },
  })
  return { pic, rainOk }
}

function s1Chart(m: Manifest, C: Copy) {
  const a = m.nisar_delta_in_mask!, b = m.s1!.delta_in_mask
  return chartPic({
    type: 'bar',
    data: {
      labels: [C.copol, C.xpol],
      datasets: [
        { label: C.s1L, data: [a.hh, a.hv], backgroundColor: '#1f78c1', maxBarThickness: 60, borderRadius: 2 },
        { label: C.s1C, data: [b.vv, b.vh], backgroundColor: '#9aa3b2', maxBarThickness: 60, borderRadius: 2 },
      ],
    },
    options: { scales: { x: { ticks: tick, grid: { display: false } }, y: { ticks: tick, grid, title: { display: true, text: 'dB', ...tick } } } },
  }, 900, 280)
}

// ---------- maquetación del PDF ----------
type Align = 'left' | 'right'
interface LegendItem {
  color: string
  label: string
  shape?: 'fill' | 'line' | 'dash' | 'dot' | 'ring'
}

class Writer {
  pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  y = TOP
  accent = INK
  C: Copy = copy()
  /** Página en la que empieza cada caso, para la cabecera de las páginas siguientes y el índice */
  starts: { page: number; title: string; id: string }[] = []
  private node: unknown = null

  newPage() {
    this.pdf.addPage()
    this.y = TOP + 2
  }
  space() {
    return PAGE_H - BOTTOM - this.y
  }
  /** Títulos pendientes: se dibujan junto al primer bloque que los sigue, así nunca quedan solos al pie de una página */
  private pending: { h: number; draw: () => void }[] = []
  pendingH() {
    return this.pending.reduce((a, p) => a + p.h, 0)
  }
  ensure(h: number) {
    if (this.y + h + this.pendingH() > PAGE_H - BOTTOM) this.newPage()
    if (!this.pending.length) return
    // los títulos cambian la fuente; quien llama ya la había fijado (y medido el texto con ella): se restaura
    const { fontName, fontStyle } = this.pdf.getFont()
    const size = this.pdf.getFontSize()
    const color = this.pdf.getTextColor()
    const ps = this.pending
    this.pending = []
    for (const p of ps) p.draw()
    this.pdf.setFont(fontName, fontStyle)
    this.pdf.setFontSize(size)
    this.pdf.setTextColor(color)
  }
  font(size: number, style: 'normal' | 'bold' | 'italic' = 'normal', color = INK) {
    this.pdf.setFont('helvetica', style)
    this.pdf.setFontSize(size)
    this.pdf.setTextColor(color)
  }
  split(text: string, width: number, size: number, style: 'normal' | 'bold' | 'italic' = 'normal'): string[] {
    this.pdf.setFont('helvetica', style)
    this.pdf.setFontSize(size)
    return this.pdf.splitTextToSize(clean(text), width) as string[]
  }
  para(text: string, o: { size?: number; color?: string; style?: 'normal' | 'bold' | 'italic'; x?: number; width?: number; gap?: number; lh?: number } = {}) {
    const txt = clean(text)
    if (!txt) return
    const size = o.size ?? 9.5, x = o.x ?? MX, width = o.width ?? CW, lh = size * PT * (o.lh ?? 1.42)
    const lines = this.split(txt, width, size, o.style)
    this.font(size, o.style, o.color ?? INK)
    for (const ln of lines) {
      this.ensure(lh)
      this.pdf.text(ln, x, this.y, { baseline: 'top' })
      this.y += lh
    }
    this.y += o.gap ?? 2.5
  }
  hint(text: string) {
    this.para(text, { size: 8.5, color: MUTED, gap: 2.5 })
  }
  /** Título de sección (con marcador en el PDF) */
  section(title: string) {
    this.pending.push({
      h: 11.5,
      draw: () => {
        this.y += 4
        this.pdf.setFillColor(this.accent)
        this.pdf.rect(MX, this.y + 0.6, 2.4, 3.4, 'F')
        this.font(9.5, 'bold', INK)
        this.pdf.text(clean(title).toUpperCase(), MX + 4.5, this.y, { baseline: 'top', charSpace: 0.25 })
        this.pdf.outline.add(this.node as never, clean(title), { pageNumber: this.pdf.getNumberOfPages() })
        this.y += 7.5
      },
    })
  }
  /** Nota corta que introduce el bloque siguiente (va con él, como un título) */
  lead(text: string) {
    const lines = this.split(text, CW, 8.5)
    const lh = 8.5 * PT * 1.42
    this.pending.push({
      h: lines.length * lh + 2.5,
      draw: () => {
        this.font(8.5, 'normal', MUTED)
        this.pdf.text(lines, MX, this.y, { baseline: 'top', lineHeightFactor: 1.42 })
        this.y += lines.length * lh + 2.5
      },
    })
  }
  sub(title: string) {
    const lines = this.split(title, CW, 9, 'bold')
    const lh = 9 * PT * 1.42
    this.pending.push({
      h: lines.length * lh + 1.5,
      draw: () => {
        this.font(9, 'bold', INK)
        this.pdf.text(lines, MX, this.y, { baseline: 'top', lineHeightFactor: 1.42 })
        this.y += lines.length * lh + 1.5
      },
    })
  }

  /** Comienzo de un caso: banda de color, título, metadatos y resumen */
  caseHeader(m: Manifest, first: boolean) {
    const c = CONTENT[m.id]
    const meta = KIND_META[m.kind]
    this.accent = PRINT[m.kind]
    if (!first) this.newPage()
    const page = this.pdf.getNumberOfPages()
    this.starts.push({ page, title: c?.headline ?? m.title, id: m.id })
    this.node = this.pdf.outline.add(null as never, clean(c?.headline ?? m.title), { pageNumber: page })
    this.pdf.setFillColor(this.accent)
    this.pdf.rect(0, 0, PAGE_W, 4, 'F')
    this.y = 15
    this.font(8, 'bold', MUTED)
    this.pdf.text(clean(this.C.kicker).toUpperCase(), MX, this.y, { baseline: 'top', charSpace: 0.3 })
    this.font(8, 'normal', FAINT)
    this.pdf.text(clean(this.C.generated(new Date().toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' }))), PAGE_W - MX, this.y, { baseline: 'top', align: 'right' })
    this.y += 7
    this.para(c?.headline ?? m.title, { size: 21, style: 'bold', lh: 1.18, gap: 2 })
    // tipo · lugar · fechas
    this.font(10, 'bold', this.accent)
    const kind = clean(c?.kindLabel ?? meta.label)
    this.pdf.text(kind, MX, this.y, { baseline: 'top' })
    const kw = this.pdf.getTextWidth(kind)
    this.font(10, 'normal', MUTED)
    this.pdf.text(`  ·  ${clean(c?.place)}  ·  ${clean(c?.dateLabel)}`, MX + kw, this.y, { baseline: 'top' })
    this.y += 7
    if (m.mock) this.para(t('mock'), { size: 9, style: 'bold', color: '#b45309' })
    if (c?.summary) this.para(c.summary, { size: 11, lh: 1.45, gap: 3 })
  }

  kv(rows: [string, string][], labelW = 46) {
    for (const [k, v] of rows) {
      const val = this.split(v, CW - labelW, 9)
      const h = Math.max(1, val.length) * 9 * PT * 1.38 + 2.6
      this.ensure(h)
      this.font(8.5, 'normal', MUTED)
      this.pdf.text(clean(k), MX, this.y + 0.2, { baseline: 'top' })
      this.font(9, 'normal', INK)
      this.pdf.text(val, MX + labelW, this.y, { baseline: 'top', lineHeightFactor: 1.38 })
      this.y += h
      this.pdf.setDrawColor(LINE)
      this.pdf.setLineWidth(0.2)
      this.pdf.line(MX, this.y - 1.3, MX + CW, this.y - 1.3)
    }
    this.y += 2
  }

  /** Tarjetas de cifras, tres por fila */
  metricGrid(items: { value: string; unit: string; label: string }[]) {
    const cols = 3, gap = 3, w = (CW - gap * (cols - 1)) / cols
    for (let i = 0; i < items.length; i += cols) {
      const row = items.slice(i, i + cols)
      const labels = row.map((x) => this.split(x.label, w - 7, 8))
      const h = 16 + Math.max(...labels.map((l) => l.length)) * 8 * PT * 1.3
      this.ensure(h + gap)
      row.forEach((x, j) => {
        const x0 = MX + j * (w + gap)
        this.pdf.setFillColor(SOFT)
        this.pdf.roundedRect(x0, this.y, w, h, 1.6, 1.6, 'F')
        this.pdf.setFillColor(this.accent)
        this.pdf.rect(x0, this.y + 2.5, 0.9, 9, 'F')
        this.font(15, 'bold', INK)
        const v = clean(x.value)
        this.pdf.text(v, x0 + 4, this.y + 3.2, { baseline: 'top' })
        const vw = this.pdf.getTextWidth(v)
        this.font(9, 'normal', MUTED)
        this.pdf.text(clean(x.unit), x0 + 4 + vw + 1.2, this.y + 5.4, { baseline: 'top' })
        this.font(8, 'normal', MUTED)
        this.pdf.text(labels[j], x0 + 4, this.y + 11.5, { baseline: 'top', lineHeightFactor: 1.3 })
      })
      this.y += h + gap
    }
    this.y += 1
  }

  table(head: string[], rows: string[][], widths: number[], o: { align?: Align[]; swatch?: (string | null)[]; size?: number } = {}) {
    const size = o.size ?? 8.5
    const total = widths.reduce((a, b) => a + b, 0)
    const ws = widths.map((w) => (w / total) * CW)
    const lh = size * PT * 1.3
    const drawHead = () => {
      this.pdf.setFillColor(SOFT)
      this.pdf.rect(MX, this.y, CW, lh + 3, 'F')
      this.font(size - 0.5, 'bold', MUTED)
      let x = MX
      head.forEach((h, i) => {
        const right = o.align?.[i] === 'right'
        this.pdf.text(clean(h), right ? x + ws[i] - 2 : x + 2, this.y + 1.5, { baseline: 'top', align: right ? 'right' : 'left' })
        x += ws[i]
      })
      this.y += lh + 3
    }
    this.ensure(lh * 3 + 6)
    drawHead()
    rows.forEach((r, ri) => {
      const cells = r.map((c, i) => this.split(c, ws[i] - 4 - (i === 0 && o.swatch?.[ri] ? 4 : 0), size))
      const h = Math.max(...cells.map((c) => c.length)) * lh + 2.6
      if (this.y + h > PAGE_H - BOTTOM) {
        this.newPage()
        drawHead()
      }
      let x = MX
      cells.forEach((c, i) => {
        const right = o.align?.[i] === 'right'
        let tx = right ? x + ws[i] - 2 : x + 2
        if (i === 0 && o.swatch?.[ri]) {
          this.pdf.setFillColor(o.swatch[ri]!)
          this.pdf.rect(x + 2, this.y + 1.6, 2.6, 2.6, 'F')
          tx += 4
        }
        this.font(size, 'normal', INK)
        this.pdf.text(c, tx, this.y + 1.3, { baseline: 'top', align: right ? 'right' : 'left', lineHeightFactor: 1.3 })
        x += ws[i]
      })
      this.y += h
      this.pdf.setDrawColor(LINE)
      this.pdf.setLineWidth(0.2)
      this.pdf.line(MX, this.y, MX + CW, this.y)
    })
    this.y += 4
  }

  /** Imagen a lo ancho (o en una columna) con pie de foto; nunca más alta que `maxH` */
  image(p: Pic | null, o: { x?: number; w?: number; maxH?: number; caption?: string; border?: boolean } = {}) {
    let w = o.w ?? CW
    const x0 = o.x ?? MX
    if (!p) {
      this.ensure(14)
      this.pdf.setFillColor(SOFT)
      this.pdf.rect(x0, this.y, w, 10, 'F')
      this.font(8.5, 'italic', FAINT)
      this.pdf.text(clean(this.C.missing), x0 + w / 2, this.y + 3.5, { baseline: 'top', align: 'center' })
      this.y += 13
      return
    }
    let h = (w * p.h) / p.w
    const cap = o.caption ? this.split(o.caption, o.w ?? CW, 8) : []
    const capH = cap.length * 8 * PT * 1.35 + 4
    // si no cabe pero queda bastante sitio, la imagen se encoge en vez de saltar de página
    // (así el título que la precede no se queda solo al pie)
    const avail = PAGE_H - BOTTOM - this.y - capH - this.pendingH()
    const maxH = Math.min(o.maxH ?? 150, h > avail && avail >= 65 ? avail : Infinity)
    if (h > maxH) {
      w = (maxH * p.w) / p.h
      h = maxH
    }
    this.ensure(h + capH)
    const x = x0 + ((o.w ?? CW) - w) / 2
    this.pdf.addImage(p.url, p.url.startsWith('data:image/png') ? 'PNG' : 'JPEG', x, this.y, w, h, undefined, 'FAST')
    if (o.border) {
      this.pdf.setDrawColor(LINE)
      this.pdf.setLineWidth(0.25)
      this.pdf.rect(x, this.y, w, h)
    }
    this.y += h + 1.8
    if (cap.length) {
      this.font(8, 'normal', MUTED)
      this.pdf.text(cap, x0, this.y, { baseline: 'top', lineHeightFactor: 1.35 })
      this.y += cap.length * 8 * PT * 1.35
    }
    this.y += 3
  }

  /** Varias imágenes en columnas, con un pie corto debajo de cada una */
  grid(items: { pic: Pic | null; caption: string }[], cols: number) {
    const gap = 3, w = (CW - gap * (cols - 1)) / cols
    for (let i = 0; i < items.length; i += cols) {
      const row = items.slice(i, i + cols)
      const hs = row.map((it) => (it.pic ? (w * it.pic.h) / it.pic.w : 10))
      const caps = row.map((it) => this.split(it.caption, w, 7.5))
      const h = Math.max(...hs) + 2 + Math.max(...caps.map((c) => c.length)) * 7.5 * PT * 1.3
      this.ensure(h + 3)
      row.forEach((it, j) => {
        const x = MX + j * (w + gap)
        if (it.pic) this.pdf.addImage(it.pic.url, 'JPEG', x, this.y, w, hs[j], undefined, 'FAST')
        else {
          this.pdf.setFillColor(SOFT)
          this.pdf.rect(x, this.y, w, hs[j], 'F')
        }
        this.font(7.5, 'normal', MUTED)
        this.pdf.text(caps[j], x, this.y + Math.max(...hs) + 1.6, { baseline: 'top', lineHeightFactor: 1.3 })
      })
      this.y += h + 3
    }
    this.y += 1
  }

  legend(items: LegendItem[]) {
    if (!items.length) return
    this.font(8, 'normal', INK)
    let x = MX
    this.ensure(6)
    for (const it of items) {
      const label = clean(it.label)
      const w = 6 + this.pdf.getTextWidth(label) + 5
      if (x + w > MX + CW) {
        x = MX
        this.y += 4.6
        this.ensure(6)
      }
      const cy = this.y + 1.5
      this.pdf.setDrawColor(it.color)
      this.pdf.setFillColor(it.color)
      this.pdf.setLineWidth(0.6)
      const shape = it.shape ?? 'fill'
      if (shape === 'fill') this.pdf.rect(x, cy - 1.3, 4, 2.6, 'F')
      else if (shape === 'dot') this.pdf.circle(x + 2, cy, 1, 'F')
      else if (shape === 'ring') this.pdf.circle(x + 2, cy, 1.2, 'S')
      else {
        if (shape === 'dash') this.pdf.setLineDashPattern([0.9, 0.6], 0)
        this.pdf.line(x, cy, x + 4, cy)
        this.pdf.setLineDashPattern([], 0)
      }
      this.font(8, 'normal', INK)
      this.pdf.text(label, x + 6, this.y, { baseline: 'top' })
      x += w
    }
    this.y += 6
  }

  /** Barra de degradado con marcas (escalas de color InSAR) */
  gradient(stops: [number, string][], ticks: string[], sub?: string[]) {
    this.ensure(14)
    const n = 120, w = CW * 0.6, x0 = MX, h = 2.6
    for (let i = 0; i < n; i++) {
      const p = i / (n - 1)
      const j = Math.max(0, stops.findIndex((s) => s[0] >= p) - 1)
      const [p0, c0] = stops[j], [p1, c1] = stops[Math.min(j + 1, stops.length - 1)]
      this.pdf.setFillColor(lerpColor(c0, c1, p1 > p0 ? (p - p0) / (p1 - p0) : 0))
      this.pdf.rect(x0 + (i * w) / n, this.y, w / n + 0.05, h, 'F')
    }
    this.y += h + 1.2
    const row = (labels: string[], size: number, color: string) => {
      this.font(size, 'normal', color)
      labels.forEach((l, i) => {
        const align = i === 0 ? 'left' : i === labels.length - 1 ? 'right' : 'center'
        this.pdf.text(clean(l), x0 + (labels.length === 1 ? 0 : (i * w) / (labels.length - 1)), this.y, { baseline: 'top', align })
      })
      this.y += size * PT * 1.4
    }
    row(ticks, 8, INK)
    if (sub) row(sub, 7.5, MUTED)
    this.y += 2
  }

  /** Barra apilada horizontal (cobertura del suelo, clases de riesgo) */
  stacked(parts: { value: number; color: string }[]) {
    const total = parts.reduce((s, p) => s + p.value, 0) || 1
    this.ensure(10)
    let x = MX
    for (const p of parts) {
      const w = Math.max(0.4, (p.value / total) * CW)
      this.pdf.setFillColor(p.color)
      this.pdf.rect(x, this.y, w, 5, 'F')
      x += w
    }
    this.y += 8
  }

  /** Barras de 0 a 1 (componentes del riesgo) */
  bars(rows: { label: string; value: number }[]) {
    for (const r of rows) {
      this.ensure(7)
      this.font(8.5, 'normal', INK)
      this.pdf.text(clean(r.label), MX, this.y, { baseline: 'top' })
      const x = MX + 34, w = CW - 34 - 16
      this.pdf.setFillColor(SOFT)
      this.pdf.rect(x, this.y + 0.4, w, 2.8, 'F')
      this.pdf.setFillColor(this.accent)
      this.pdf.rect(x, this.y + 0.4, w * (num(r.value) ? Math.max(0, Math.min(1, r.value)) : 0), 2.8, 'F')
      this.pdf.text(dec(r.value), MX + CW, this.y, { baseline: 'top', align: 'right' })
      this.y += 5.4
    }
    this.y += 2
  }

  /** Línea temporal de pasadas de radar alrededor del evento (versión vectorial de la de la web) */
  passes(p: NonNullable<(typeof CONTENT)[string]['passes']>) {
    const H = 30
    this.ensure(H + 10)
    const utc = (d: string) => new Date(d.length > 10 && !/(Z|[+-]\d\d:?\d\d)$/.test(d) ? `${d}Z` : d).getTime()
    const t0 = utc(p.from), t1 = utc(p.to)
    const L = MX + 8, W = CW - 10
    const x = (ms: number) => L + ((ms - t0) / (t1 - t0)) * W
    const y0 = this.y + 6
    const rowY = { NISAR: y0 + 6, S1C: y0 + 14, S1D: y0 + 14 } as const
    // hueco sin radar que contiene el evento
    const ts = p.list.map((q) => utc(q.date)).sort((a, b) => a - b)
    const evT = utc(p.event[0])
    const before = Math.max(...ts.filter((v) => v <= evT)), after = Math.min(...ts.filter((v) => v > evT))
    if (Number.isFinite(before) && Number.isFinite(after)) {
      this.pdf.setFillColor('#fdecec')
      this.pdf.setDrawColor('#e57373')
      this.pdf.setLineWidth(0.25)
      this.pdf.setLineDashPattern([0.8, 0.6], 0)
      this.pdf.rect(x(before), y0, x(after) - x(before), 19, 'FD')
      this.pdf.setLineDashPattern([], 0)
      this.font(7.5, 'bold', '#c62828')
      this.pdf.text(clean(t('gap')(((after - before) / 86400000).toLocaleString(locale(), { maximumFractionDigits: 1 }))), (x(before) + x(after)) / 2, this.y + 1.5, { baseline: 'top', align: 'center' })
    }
    // evento
    this.pdf.setFillColor(tint(this.accent, 0.55))
    this.pdf.rect(x(evT), y0 + 1, Math.max(0.8, x(utc(p.event[1])) - x(evT)), 17, 'F')
    this.font(7.5, 'bold', MUTED)
    this.pdf.text('L', MX, rowY.NISAR - 1.3, { baseline: 'top' })
    this.pdf.text('C', MX, rowY.S1C - 1.3, { baseline: 'top' })
    for (const q of p.list) {
      this.pdf.setFillColor(q.sensor === 'NISAR' ? '#1f78c1' : '#7b8494')
      this.pdf.circle(x(utc(q.date)), rowY[q.sensor], 1.2, 'F')
    }
    this.font(7, 'normal', MUTED)
    let i = 0
    for (let d = t0; d <= t1; d += 86400000, i++) if (i % 3 === 1) this.pdf.text(clean(fmtDay(new Date(d).toISOString().slice(0, 10))), x(d), y0 + 21.5, { baseline: 'top', align: 'center' })
    this.y = y0 + 26
    this.legend([
      { color: '#1f78c1', label: t('legendL'), shape: 'dot' },
      { color: '#7b8494', label: t('legendC'), shape: 'dot' },
      { color: tint(this.accent, 0.55), label: lang === 'es' ? 'Evento' : 'Event' },
    ])
  }

  /** Cabeceras y pies de página; se dibujan al final, cuando ya se conoce el número de páginas */
  finish(cover: boolean) {
    const n = this.pdf.getNumberOfPages()
    for (let i = 1; i <= n; i++) {
      this.pdf.setPage(i)
      const start = [...this.starts].reverse().find((s) => s.page <= i)
      if (start && start.page !== i) {
        this.font(7.5, 'normal', FAINT)
        this.pdf.text(clean(`NISEarth  ·  ${start.title}`), MX, 9, { baseline: 'top' })
        this.pdf.setDrawColor(LINE)
        this.pdf.setLineWidth(0.2)
        this.pdf.line(MX, 13.5, PAGE_W - MX, 13.5)
      }
      if (cover && i === 1) continue
      this.pdf.setDrawColor(LINE)
      this.pdf.setLineWidth(0.2)
      this.pdf.line(MX, PAGE_H - 13, PAGE_W - MX, PAGE_H - 13)
      this.font(7.5, 'normal', FAINT)
      this.pdf.text(clean(this.C.footer), MX, PAGE_H - 10.5, { baseline: 'top' })
      this.pdf.text(`${i} / ${n}`, PAGE_W - MX, PAGE_H - 10.5, { baseline: 'top', align: 'right' })
    }
  }
}

// ---------- contenido de un caso ----------
const kmSize = (m: Manifest) => {
  const [w, s, e, n] = m.bbox
  const lat = ((s + n) / 2) * (Math.PI / 180)
  return `${fmtNum((e - w) * 111.32 * Math.cos(lat))} × ${fmtNum((n - s) * 110.57)} km`
}
/** Valor cualquiera del manifest como texto corto (parámetros técnicos, pesos) */
function flat(v: unknown, depth = 0): string {
  if (v === null || v === undefined) return '-'
  if (typeof v === 'number') return fmtNum(v)
  if (typeof v === 'string' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return v.length ? v.map((x) => flat(x, depth + 1)).join(', ') : '-'
  if (typeof v === 'object' && depth < 2) return Object.entries(v as Record<string, unknown>).map(([k, x]) => `${k}: ${flat(x, depth + 1)}`).join(' · ')
  const s = JSON.stringify(v)
  return s.length > 220 ? `${s.slice(0, 220)}...` : s
}
const tracksOf = (fs: Frame[]) => [...new Set(fs.map((f) => `${f.track}${f.dir ? ` ${f.dir}` : ''}`))].join(', ')

async function writeCase(W: Writer, m: Manifest, first: boolean, progress: (s: string) => void) {
  const C = W.C
  const c = CONTENT[m.id]
  const meta = KIND_META[m.kind]
  const accent = PRINT[m.kind]
  const base = `/data/${m.id}`
  const step = async (s: string) => {
    progress(s)
    await new Promise((r) => setTimeout(r)) // deja respirar a la interfaz
  }
  const frame = mapFrame(m)

  W.caseHeader(m, first)

  // ficha
  W.section(C.overview)
  const rows: [string, string][] = [
    [C.fIncident, m.title],
    [C.fKind, c?.kindLabel ? `${meta.label} · ${c.kindLabel}` : meta.label],
    [C.fPlace, `${c?.place ?? ''}${c?.region && !c.place.includes(c.region) ? ` (${c.region})` : ''}`],
    [C.fRegion, m.region === 'world' ? C.regionWorld : C.regionEs],
    [C.fEvent, fmtDate(m.event)],
    [C.fDates, c?.dateLabel ?? ''],
    m.insar ? [C.fPeriod, `${fmtDate(m.insar.start)} → ${fmtDate(m.insar.end)} (${m.insar.days} d)`] : [C.fPair, `${fmtDate(m.pair.before)} → ${fmtDate(m.pair.after)}`],
    [C.fTracks, tracksOf(m.frames)],
    [C.fAcq, String(m.frames.length)],
    [C.fSensors, `NISAR (NASA-ISRO), ${m.insar ? m.insar.product : 'L2 GCOV'}${m.s1 ? ' · Copernicus Sentinel-1 (ASF HyP3)' : ''}`],
    [C.fCenter, fmtLatLon(m.center[0], m.center[1])],
    [C.fBbox, `${fmtLatLon(m.bbox[0], m.bbox[3])} → ${fmtLatLon(m.bbox[2], m.bbox[1])}`],
    [C.fSize, kmSize(m)],
  ]
  if (m.firms) rows.push([C.fFirms, C.firmsRow(fmtInt(m.firms.count), fmtDay(m.firms.from), fmtDay(m.firms.to), m.firms.in_mask_pct)])
  W.kv(rows)

  // cifras
  const ms = visibleMetrics(m)
  if (ms.length) {
    W.section(C.metrics)
    W.metricGrid(ms.map((x) => ({ value: fmtNum(x.value), unit: unitLabel(x.unit), label: metricName(m, x) })))
  }

  // mapa de situación
  await step(C.map)
  const ref = m.overlays.effis ?? m.overlays.ems ?? m.overlays.ref
  const [refGj, roads, rail, firms, events] = await Promise.all([
    ref ? getJson<FC>(`${base}/${ref}`) : null,
    m.overlays.roads ? getJson<FC>(`${base}/${m.overlays.roads}`) : null,
    m.overlays.rail ? getJson<FC>(`${base}/${m.overlays.rail}`) : null,
    m.overlays.firms ? getJson<FC>(`${base}/${m.overlays.firms}`) : null,
    m.overlays.events ? getJson<FC>(`${base}/${m.overlays.events}`) : null,
  ])
  const maskColor = accent
  const situation = await renderMap(m, frame, 1200, m.layers.mask ? [{ url: `${base}/${m.layers.mask}`, alpha: 0.78 }] : [], ({ ctx, P, u }) => {
    const stroke = (fc: FC | null, color: string, width: number, dash?: number[]) => {
      if (!fc) return
      ctx.save()
      ctx.strokeStyle = color
      ctx.lineWidth = width * u
      ctx.lineJoin = 'round'
      if (dash) ctx.setLineDash(dash.map((d) => d * u))
      for (const f of fc.features) {
        if (!f.geometry) continue
        ctx.beginPath()
        tracePath(ctx, f.geometry, P)
        ctx.stroke()
      }
      ctx.restore()
    }
    stroke(refGj, '#facc15', 2, [6, 4])
    stroke(roads, '#fbbf24', 2.4)
    stroke(rail, '#ff3b5c', 2.8)
    if (firms && m.firms) {
      const t0 = new Date(m.firms.from).getTime(), t1 = new Date(m.firms.to).getTime()
      for (const f of firms.features) {
        if (!f.geometry) continue
        const k = (new Date(String(f.properties?.date ?? m.firms.from)).getTime() - t0) / Math.max(1, t1 - t0)
        ctx.fillStyle = k < 0.5 ? lerpColor('#fde047', '#f97316', k * 2) : lerpColor('#f97316', '#b91c1c', (k - 0.5) * 2)
        for (const p of points(f.geometry)) {
          const [x, y] = P(p[0], p[1])
          ctx.beginPath()
          ctx.arc(x, y, 1.8 * u, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
    if (events)
      for (const f of events.features) {
        if (!f.geometry) continue
        const mag = Number(f.properties?.mag ?? 3)
        for (const p of points(f.geometry)) {
          const [x, y] = P(p[0], p[1])
          ctx.beginPath()
          ctx.arc(x, y, Math.max(3, (mag - 1.5) * 3.2) * u, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(244,114,182,0.3)'
          ctx.fill()
          ctx.strokeStyle = '#f472b6'
          ctx.lineWidth = 1.6 * u
          ctx.stroke()
        }
      }
    if (m.insar?.hotspot) {
      const [x, y] = P(m.insar.hotspot[0], m.insar.hotspot[1])
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2.4 * u
      ctx.beginPath()
      ctx.arc(x, y, 8 * u, 0, Math.PI * 2)
      ctx.stroke()
    }
  })
  W.section(C.map)
  W.image(situation, { maxH: 125, caption: `${C.mapCap}${situation && !situation.base ? ` ${C.noBase}` : ''}` })
  const leg: LegendItem[] = []
  if (m.layers.mask) leg.push({ color: maskColor, label: maskLabel(m) })
  if (ref) leg.push({ color: '#d4a90f', label: m.overlays.ems ? t('ems') : m.overlays.effis ? t('effis') : m.refLabel ?? 'Ref.', shape: 'dash' })
  if (roads) leg.push({ color: '#e0a514', label: lang === 'es' ? 'Carreteras afectadas' : 'Affected roads', shape: 'line' })
  if (rail) leg.push({ color: '#ff3b5c', label: m.insar ? t('railOsm') : lang === 'es' ? 'Vía férrea' : 'Railway', shape: 'line' })
  if (firms) leg.push({ color: '#f97316', label: C.firmsDots, shape: 'dot' })
  if (events) leg.push({ color: '#f472b6', label: t('quakes'), shape: 'ring' })
  if (m.insar?.hotspot) leg.push({ color: '#9aa3b2', label: C.hotspot, shape: 'ring' })
  W.legend(leg)

  // pasadas de radar
  if (c?.passes) {
    W.section(t('passes'))
    W.passes(c.passes)
  }

  // imágenes de radar
  await step(C.radar)
  W.section(C.radar)
  if (m.insar) {
    const last = m.frames[m.frames.length - 1]
    const mov = m.layers.change ? await renderMap(m, frame, 1200, [{ url: `${base}/${m.layers.change}`, alpha: 0.9 }]) : null
    if (mov) {
      W.sub(C.movement)
      W.image(mov, { maxH: 115, caption: t('hintChangeI') })
      const v = dec(m.insar.vmax_cm, 1)
      W.gradient([[0, '#d7191c'], [0.4, '#f6c6b8'], [0.5, '#f2f2f2'], [0.6, '#b8c8f6'], [1, '#1f4cff']], [`-${v} cm`, '0', `+${v} cm`], [t('legendAway'), '', t('legendToward')])
    }
    if (last) {
      const [fr, co] = await Promise.all([
        renderMap(m, frame, 700, [{ url: `${base}/${last.hv}`, alpha: 0.9 }]),
        last.rgb ? renderMap(m, frame, 700, [{ url: `${base}/${last.rgb}`, alpha: 0.9 }]) : null,
      ])
      const pairLbl = `${fmtDay(last.ref ?? m.insar.start)} → ${fmtDay(last.date)} · T${last.track} ${last.dir ?? ''}`
      W.grid([{ pic: fr, caption: `${C.fringes} (${pairLbl}). ${t('legendFringe')(dec(m.insar.fringe_cm, 1))}` }, ...(co ? [{ pic: co, caption: `${C.coherence} (${pairLbl}). ${t('titleCoh')}` }] : [])], 2)
    }
  } else {
    const pol = m.kind === 'fire' ? 'hv' : 'hh'
    const fb = m.frames.find((f) => f.date === m.pair.before) ?? m.frames[0]
    const fa = m.frames.find((f) => f.date === m.pair.after) ?? m.frames[m.frames.length - 1]
    const [pb, pa] = await Promise.all([renderMap(m, frame, 700, [{ url: `${base}/${fb[pol]}` }]), renderMap(m, frame, 700, [{ url: `${base}/${fa[pol]}` }])])
    W.lead(C.radarCap(pol.toUpperCase()))
    W.grid([
      { pic: pb, caption: `${cap(t('pre'))} · ${fmtDate(fb.date)} · ${pol.toUpperCase()} · T${fb.track}` },
      { pic: pa, caption: `${cap(t('post'))} · ${fmtDate(fa.date)} · ${pol.toUpperCase()} · T${fa.track}` },
    ], 2)
    if (m.layers.change) {
      const ch = await renderMap(m, frame, 1200, [{ url: `${base}/${m.layers.change}`, alpha: 0.9 }])
      W.sub(C.change)
      W.image(ch, { maxH: 115, caption: t('hintChange') })
    }
  }

  // todas las adquisiciones en miniatura
  if (m.frames.length > 2) {
    await step(C.series)
    W.section(C.series)
    const pol = m.insar ? 'hh' : m.kind === 'fire' ? 'hv' : 'hh'
    const thumbs = []
    for (const f of m.frames) {
      const pic = await renderMap(m, frame, 520, [{ url: `${base}/${f[pol]}`, alpha: 0.9 }])
      const ev = new Date(f.date) > new Date(m.event)
      thumbs.push({
        pic,
        caption: m.insar ? `${fmtDay(m.insar.mode === 'chain' ? m.insar.start : f.ref ?? f.date)} → ${fmtDay(f.date)} · T${f.track} ${f.dir ?? ''}` : `${fmtDate(f.date)} · T${f.track} · ${ev ? t('post') : t('pre')}`,
      })
    }
    W.grid(thumbs, 3)
  }

  // gráficos
  await step(C.charts)
  W.section(C.charts)
  if (m.id === 'lorca' && m.insar) {
    const s = lorcaCopy()
    const { pic, rainOk } = await lorcaChart(m)
    W.sub(s.title)
    W.image(pic, { maxH: 80 })
    W.legend([{ color: '#d9822b', label: s.displacement, shape: 'line' }, { color: '#2f8fd8', label: s.rain }])
    W.hint(s.note)
    W.hint(rainOk ? s.meta : s.missing)
    W.hint(s.caution)
  } else {
    W.sub(m.insar ? t('chartInsar')(m.insar.mode === 'pairs') : t('chart'))
    W.image(await seriesChart(m, accent), { maxH: 80 })
    if (m.insar) W.legend([{ color: accent, label: 'cm', shape: m.insar.mode === 'pairs' ? 'fill' : 'line' }, { color: '#d5dae2', label: lang === 'es' ? `Ruido de fondo (±${dec(m.insar.noise_cm, 1)} cm)` : `Background noise (±${dec(m.insar.noise_cm, 1)} cm)` }])
    else W.legend([
      { color: m.kind === 'fire' ? '#7b8494' : accent, label: 'HH', shape: 'line' },
      { color: m.kind === 'fire' ? accent : '#7b8494', label: 'HV', shape: m.kind === 'flood' ? 'dash' : 'line' },
    ])
  }
  if (m.daily) {
    W.sub(m.daily.kind === 'rain' ? t('rainChart')(m.daily.place ?? '') : t('firmsChart'))
    W.image(await dailyChart(m), { maxH: 75 })
    W.hint(m.daily.kind === 'rain' ? t('rainNote').replace(/blancas|White/, (w) => (w === 'White' ? 'Grey' : 'grises')) : t('firmsNote')(m.firms?.in_mask_pct ?? 0))
    W.hint(`${lang === 'es' ? 'Fuente' : 'Source'}: ${m.daily.source}`)
  }

  // banda L frente a banda C
  if (m.s1) {
    await step(C.s1)
    W.section(C.s1)
    const [lc, cc] = await Promise.all([
      m.layers.change ? renderMap(m, frame, 700, [{ url: `${base}/${m.layers.change}`, alpha: 0.9 }]) : null,
      renderMap(m, frame, 700, [{ url: `${base}/${m.s1.change}`, alpha: 0.9 }]),
    ])
    W.grid([
      { pic: lc, caption: `${C.s1Change(C.s1L)} · ${fmtDay(m.pair.before)} → ${fmtDay(m.pair.after)}` },
      { pic: cc, caption: `${C.s1Change(C.s1C)} · ${fmtDay(m.s1.pair.before)} → ${fmtDay(m.s1.pair.after)} · T${m.s1.frames[0]?.track ?? ''}` },
    ], 2)
    if (m.nisar_delta_in_mask) {
      W.sub(C.s1Chart)
      W.image(await s1Chart(m, C), { maxH: 62 })
      W.legend([{ color: '#1f78c1', label: C.s1L }, { color: '#9aa3b2', label: C.s1C }])
      const d = (v: number) => `${v > 0 ? '+' : ''}${dec(v, 2)} dB`
      W.table(['', C.s1L, C.s1C], [
        [C.copol, d(m.nisar_delta_in_mask.hh), d(m.s1.delta_in_mask.vv)],
        [C.xpol, d(m.nisar_delta_in_mask.hv), d(m.s1.delta_in_mask.vh)],
      ], [2, 1.4, 1.4], { align: ['left', 'right', 'right'] })
    }
  }

  // detalles InSAR
  if (m.insar) {
    const ins = m.insar
    W.section(C.insar)
    const r: [string, string][] = [
      [C.iProduct, ins.product],
      [C.iMode, ins.mode === 'pairs' ? C.iPairs : C.iChain],
      [C.iWl, `${dec(ins.wavelength_cm, 1)} cm`],
      [C.iScale, `±${dec(ins.vmax_cm, 1)} cm`],
      [C.iFringe, `${dec(ins.fringe_cm, 1)} cm`],
      [C.iNoise, `${dec(ins.noise_cm, 2)} cm`],
      [C.iThr, `${dec(ins.threshold_cm, 2)} cm`],
    ]
    if (ins.rate_cm_yr !== null && ins.rate_cm_yr !== undefined && m.id !== 'lorca') r.push([C.iRate, `${dec(ins.rate_cm_yr, 1)} ${unitLabel('cm/año')}`])
    r.push([C.iDays, String(ins.days)])
    if (ins.detrend) r.push([C.iDetrend, C.detrend[ins.detrend] ?? ins.detrend])
    if (ins.series) r.push([C.iSeries, ins.series === 'point' ? C.seriesPoint : C.seriesRegion])
    r.push([C.iHot, fmtLatLon(ins.hotspot[0], ins.hotspot[1])])
    W.kv(r)
    W.sub(C.pairsT)
    W.table([C.hRef, C.hSec, C.hTrack, C.hDir], ins.pairs.map((p) => [fmtDate(p.ref), fmtDate(p.sec), String(p.track), p.dir === 'A' ? C.asc : p.dir === 'D' ? C.desc : p.dir]), [1.3, 1.3, 0.8, 1.2])
  } else {
    W.section(C.acq)
    W.table([C.hDate, C.hTrack, C.hWhen], m.frames.map((f) => [fmtDate(f.date), String(f.track), `${new Date(f.date) > new Date(m.event) ? t('post') : t('pre')}${f.date === m.pair.before || f.date === m.pair.after ? ' · par' : ''}`]), [1.4, 0.8, 1.6])
  }

  // terremotos
  if (events?.features.length) {
    const qs = events.features
      .map((f) => ({ p: f.properties ?? {}, g: f.geometry }))
      .sort((a, b) => Number(b.p.mag ?? 0) - Number(a.p.mag ?? 0))
    const top = qs.slice(0, 15)
    W.section(C.quakes)
    W.lead(C.quakesNote(qs.length, top.length))
    W.table([C.hTime, C.hMag, C.hDepth, C.hPlace], top.map(({ p }) => [String(p.time ?? '').replace('T', ' ').slice(0, 16), `${dec(Number(p.mag ?? 0), 1)} ${p.magtype ?? ''}`, `${dec(Number(p.depth ?? 0), 1)} km`, String(p.place ?? '')]), [1.3, 0.8, 0.8, 2.6], { align: ['left', 'right', 'right', 'left'] })
  }

  // cobertura del suelo
  if (m.landcover) {
    const lc = m.landcover
    const names = t('lc')
    W.section(t('lcTitle')(m.kind))
    const rowsLc = lc.inside.filter((r) => r.pct >= 0.1)
    W.stacked(rowsLc.map((r) => ({ value: r.pct, color: LC_COLORS[r.cls] ?? LC_COLORS.other })))
    W.table([C.hCover, C.hHa, C.hPct], rowsLc.map((r) => [names[r.cls] ?? r.cls, fmtInt(r.ha), dec(r.pct, 1)]), [2, 1, 0.8], { align: ['left', 'right', 'right'], swatch: rowsLc.map((r) => LC_COLORS[r.cls] ?? LC_COLORS.other) })
    const crop = lc.outside_ref?.find((r) => r.cls === 'crop')
    if (crop && crop.pct >= 30) W.hint(t('lcOutside')(Math.round(crop.pct), fmtInt(crop.ha)))
    if (lc.outside_ref?.length) {
      W.sub(C.outsideRef)
      W.table([C.hCover, C.hHa, C.hPct], lc.outside_ref.map((r) => [names[r.cls] ?? r.cls, fmtInt(r.ha), dec(r.pct, 1)]), [2, 1, 0.8], { align: ['left', 'right', 'right'], swatch: lc.outside_ref.map((r) => LC_COLORS[r.cls] ?? LC_COLORS.other) })
    }
    const pop = exposureText(m)
    if (pop) W.para(pop, { size: 9.5 })
    W.hint(`${lc.source}${m.exposure ? ` · ${m.exposure.source}` : ''}`)
  }

  // índice de riesgo
  if (m.risk) {
    await step(t('riskTitle'))
    const r = m.risk
    const rt = riskTexts(m)
    const names = t('riskClasses')
    const drv = t('riskDriverNames')
    W.section(t('riskTitle'))
    if (rt.note) W.hint(rt.note)
    W.para(`${rt.popHigh} ${rt.lead}`, { size: 10.5, style: 'bold' })
    const cells = await getJson<FC>(`${base}/${r.files.geojson}`)
    if (cells) {
      const pic = await renderMap(m, frame, 1200, [], ({ ctx, P, u }) => {
        ctx.lineWidth = 0.6 * u
        ctx.strokeStyle = 'rgba(7,9,13,0.35)'
        for (const f of cells.features) {
          if (!f.geometry) continue
          const k = Number(f.properties?.cls ?? 0)
          ctx.beginPath()
          tracePath(ctx, f.geometry, P)
          ctx.fillStyle = alpha(RISK_COLORS[k] ?? RISK_COLORS[0], 0.62)
          ctx.fill()
          ctx.stroke()
        }
      })
      W.sub(C.riskMap)
      W.image(pic, { maxH: 115 })
      W.legend(names.map((nm, i) => ({ color: RISK_COLORS[i], label: nm })))
    }
    const cls = r.classes.map((x, i) => ({ ...x, i })).filter((x) => x.cells > 0)
    W.stacked(cls.map((x) => ({ value: Math.max(x.area_ha, 0.01), color: RISK_COLORS[x.i] })))
    W.table([C.hClass, C.hCells, C.hHa, C.hPeople], cls.map((x) => [names[x.i], fmtInt(x.cells), fmtInt(x.area_ha), fmtInt(x.population)]), [1.6, 1, 1, 1], { align: ['left', 'right', 'right', 'right'], swatch: cls.map((x) => RISK_COLORS[x.i]) })
    W.lead(t('riskMean'))
    W.bars([{ label: t('riskH'), value: r.components.hazard }, { label: t('riskE'), value: r.components.exposure }, { label: t('riskV'), value: r.components.vulnerability }])
    W.hint(t('riskDrivers')(drv[topDriver(r.drivers.exposure)] ?? '', drv[topDriver(r.drivers.vulnerability)] ?? ''))
    const kvr: [string, string][] = []
    if (num(r.pop_expected)) kvr.push([C.rExpected, fmtInt(r.pop_expected)])
    if (num(r.roads_high_km)) kvr.push([C.rRoads, `${fmtNum(r.roads_high_km)} km`])
    if (num(r.rail_high_km)) kvr.push([C.rRail, `${fmtNum(r.rail_high_km)} km`])
    if (num(r.critical_high)) kvr.push([C.rCritical, fmtInt(r.critical_high)])
    const weights = (r as { weights?: unknown }).weights
    if (weights && typeof weights === 'object') kvr.push([C.rWeights, flat(weights)])
    if (r.model) kvr.push([C.rModel, r.model])
    if (r.generated) kvr.push([C.rGenerated, fmtDate(r.generated)])
    W.kv(kvr)
    if (r.hotspots.length) {
      W.sub(t('riskHot'))
      const idx = (name: string) => Math.max(0, r.classes.findIndex((x) => x.cls === name))
      const hot = r.hotspots.slice(0, 10)
      W.table([C.hPlace, C.hClass, C.hIndex, C.hPeople, C.hCoords], hot.map((h) => [h.place, names[idx(h.class)], dec(h.risk), fmtInt(h.population), fmtLatLon(h.lon, h.lat)]), [1.7, 1, 0.7, 0.8, 1.9], { align: ['left', 'left', 'right', 'right', 'left'], swatch: hot.map((h) => RISK_COLORS[idx(h.class)]) })
    }
    if (rt.cascade) W.para(rt.cascade, { size: 9.5 })
    W.hint(rt.stable)
    W.hint(rt.method)
    if (r.sources?.length) W.hint(`${C.rSources}: ${r.sources.join(' · ')}`)
  }

  // escenario T100 (Lorca)
  if (m.layers.flood_t100) {
    W.section(C.t100)
    const pic = await renderMap(m, frame, 1200, [...(m.layers.change ? [{ url: `${base}/${m.layers.change}`, alpha: 0.85 }] : []), { url: `${base}/${m.layers.flood_t100}`, alpha: 0.75 }])
    W.image(pic, { maxH: 115, caption: C.t100Cap })
  }

  // comparación con NASA / JPL
  if (m.official) {
    await step(t('official'))
    const o = m.official
    W.section(t('official'))
    if (o.file) W.image(await picture(`${base}/${o.file}`), { maxH: 120, border: true })
    W.para(`${t('officialSays')}: ${CONTENT[m.id]?.officialClaim ?? o.claim}`, { size: 9.5 })
    W.hint(t('officialNote')(fmtDate(o.date)))
    W.hint(`${t('officialCredit')}: ${o.credit} · ${o.url}`)
  }

  // textos del caso
  const hz = hazardMeta(m.kind)
  if (hz) {
    W.section(C.how)
    W.kv([[t('hazSignature'), hz.signature], [t('hazTechnique'), hz.technique], [t('hazProducts'), hz.products]], 40)
  }
  if (c?.why?.length) {
    W.section(t('why'))
    for (const w of c.why) {
      W.sub(w.title)
      W.para(w.text, { size: 9.5, color: '#2b3240' })
    }
  }
  if (c?.who?.length) {
    W.section(t('who'))
    W.kv(c.who.map((w) => [w.title, w.text]), 46)
  }

  // parámetros del pipeline
  if (m.stats && Object.keys(m.stats).length) {
    W.section(C.stats)
    W.kv(Object.entries(m.stats).map(([k, v]) => [k, flat(v)]), 50)
  }

  // fuentes
  W.section(C.sources)
  W.para(sourceLine(m), { size: 8.5, color: MUTED })
  if (m.id === 'lorca') {
    const s = lorcaCopy()
    W.hint(s.insar)
    W.hint(s.meta)
  }
  if (m.refLabel) W.hint(m.refLabel)
  if (m.landcover) W.hint(t('srcLc'))
  W.sub(C.files)
  const files = [`${base}/manifest.json`, ...(m.risk ? [`${base}/${m.risk.files.csv}`, `${base}/${m.risk.files.geojson}`] : []), ...(m.id === 'lorca' ? [`${base}/rain-era5.json`] : [])]
  for (const f of files) {
    W.ensure(5)
    W.font(8, 'normal', '#1f5fa8')
    W.pdf.textWithLink(`${location.origin}${f}`, MX, W.y, { url: `${location.origin}${f}`, baseline: 'top' })
    W.y += 4.4
  }
  W.y += 2
  W.hint(C.disclaimer)
}

// ---------- API ----------
const done = () => imgCache.clear()
const stamp = () => new Date().toISOString().slice(0, 10)

/** Descarga el informe PDF de un caso */
export async function exportCasePdf(m: Manifest, progress: (s: string) => void = () => {}) {
  try {
    const W = new Writer()
    W.pdf.setProperties({ title: clean(`NISEarth · ${CONTENT[m.id]?.headline ?? m.title}`), subject: clean(m.title), creator: 'NISEarth', keywords: 'NISAR, SAR, InSAR, NASA Space Apps' })
    await writeCase(W, m, true, progress)
    W.finish(false)
    W.pdf.save(`NISEarth_${m.id}_${lang}_${stamp()}.pdf`)
  } finally {
    done()
  }
}

/** Descarga un único PDF con portada, índice y todos los casos */
export async function exportAllPdf(ids: string[], getManifest: (id: string) => Promise<Manifest>, progress: (s: string) => void = () => {}) {
  try {
    const W = new Writer()
    const C = W.C
    W.pdf.setProperties({ title: clean(`NISEarth · ${C.allTitle}`), creator: 'NISEarth', keywords: 'NISAR, SAR, InSAR, NASA Space Apps' })
    const ms: Manifest[] = []
    for (const id of ids) {
      try {
        ms.push(await getManifest(id))
      } catch (e) {
        console.error(`[report] manifest ${id}`, e) // un caso roto no impide el resto
      }
    }
    if (!ms.length) throw new Error('no manifests')
    // portada (el índice se rellena al final, cuando se conocen las páginas)
    W.pdf.setFillColor('#0b0e14')
    W.pdf.rect(0, 0, PAGE_W, 92, 'F')
    W.font(9, 'bold', '#9aa3b2')
    W.pdf.text(clean(t('kicker')).toUpperCase(), MX, 22, { baseline: 'top', charSpace: 0.3 })
    W.font(34, 'bold', '#ffffff')
    W.pdf.text('NISEarth', MX, 32, { baseline: 'top' })
    W.font(16, 'normal', '#d7dce5')
    W.pdf.text(clean(`${t('title2')} · ${C.allTitle}`), MX, 48, { baseline: 'top' })
    W.font(10, 'normal', '#aeb6c4')
    W.pdf.text(W.split(C.allSub, CW, 10), MX, 60, { baseline: 'top', lineHeightFactor: 1.4 })
    W.pdf.text(clean(C.generated(new Date().toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' }))), MX, 78, { baseline: 'top' })
    W.y = 104
    W.section(C.contents)
    const tocY = W.y
    for (let i = 0; i < ms.length; i++) {
      progress(`${i + 1}/${ms.length}`)
      try {
        await writeCase(W, ms[i], false, (s) => progress(`${i + 1}/${ms.length} · ${s}`))
      } catch (e) {
        // un caso que falla a medias no tumba el informe: se avisa en su propia página y se sigue
        console.error(`[report] ${ms[i].id}`, e)
        W.hint(C.partial)
      }
    }
    // índice con enlaces
    W.pdf.setPage(1)
    let y = tocY
    for (const [i, s] of W.starts.entries()) {
      const m = ms[i]
      const c = CONTENT[m.id]
      W.pdf.setFillColor(PRINT[m.kind])
      W.pdf.rect(MX, y + 0.9, 2.2, 2.2, 'F')
      W.font(10, 'bold', INK)
      const title = clean(c?.headline ?? m.title)
      W.pdf.textWithLink(title, MX + 5, y, { pageNumber: s.page, baseline: 'top' })
      W.font(8, 'normal', MUTED)
      W.pdf.text(clean(`${c?.kindLabel ?? KIND_META[m.kind].label} · ${c?.place ?? ''} · ${c?.dateLabel ?? ''}`), MX + 5, y + 4.6, { baseline: 'top' })
      W.font(10, 'normal', MUTED)
      W.pdf.text(String(s.page), PAGE_W - MX, y, { baseline: 'top', align: 'right' })
      y += 12
      if (y > PAGE_H - 24) break // con más de ~13 casos el índice no cabe en la portada: el marcador del PDF sigue completo
    }
    W.finish(true)
    W.pdf.save(`NISEarth_${lang === 'es' ? 'incidentes' : 'incidents'}_${lang}_${stamp()}.pdf`)
  } finally {
    done()
  }
}
