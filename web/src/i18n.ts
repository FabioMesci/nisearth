// Idioma de la interfaz (ES/EN). Los textos de cada caso están en content.ts.
export type Lang = 'es' | 'en'

const KEY = 'lang'
const read = (): Lang => {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'es' || v === 'en') return v
  } catch {
    /* almacenamiento no disponible */
  }
  return navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en'
}

export let lang: Lang = read()
const listeners: (() => void)[] = []

export function setLang(l: Lang) {
  lang = l
  try {
    localStorage.setItem(KEY, l)
  } catch {
    /* sin persistencia */
  }
  document.documentElement.lang = l
  listeners.forEach((f) => f())
}
export const onLang = (f: () => void) => listeners.push(f)

export const locale = () => (lang === 'es' ? 'es-ES' : 'en-GB')
export const fmtDay = (d: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) =>
  new Date(d).toLocaleDateString(locale(), opts)

const UI = {
  es: {
    kicker: 'NASA Space Apps 2026 · Dancing with the SARs',
    title1: 'ESPAÑA',
    title2: 'DESDE EL RADAR',
    tagline: 'Inundaciones e incendios de 2026 vistos por <strong>NISAR</strong>, el radar que ve a través de las nubes y el humo.',
    incidents: 'Incidentes 2026',
    story: '▶ Ver la historia',
    back: '← Volver al globo',
    flood: 'Inundación',
    fire: 'Incendio forestal',
    radarView: 'Vista del radar',
    compare: 'Antes / después',
    timeline: 'Serie temporal',
    change: 'Cambio',
    bandL: 'Banda L · NISAR',
    bandC: 'Banda C · Sentinel-1',
    maskWater: 'Máscara de agua',
    maskBurn: 'Máscara de quemado',
    infra: 'Vías y carreteras afectadas',
    effis: 'Perímetro oficial EFFIS',
    opacity: 'Opacidad radar',
    hintCompare: 'Arrastra la barra vertical sobre el mapa para comparar antes y después.',
    hintTimeline: 'Una imagen cada 12 días: pulsa ▶ para ver la «danza» de la superficie.',
    hintChange: 'Azul: la señal baja (agua nueva o vegetación perdida). Rojo: la señal sube.',
    chart: 'Señal de radar en la zona afectada (dB)',
    why: '¿Por qué se ve así?',
    who: 'Para quién sirve',
    passes: 'Pasadas de radar sobre la zona',
    legendL: 'NISAR (banda L)',
    legendC: 'Sentinel-1 C/D (banda C)',
    legendEv: 'Tormenta',
    gap: (d: string) => `${d} días sin radar`,
    before: 'ANTES',
    after: 'DESPUÉS',
    pre: 'antes',
    post: 'después',
    mock: 'DATOS DE PRUEBA · pendiente de datos NISAR reales',
    source: (track: number, a: string, b: string, s1: boolean) =>
      `Datos: NASA-ISRO NISAR L2 GCOV (banda L, HH/HV) vía ASF DAAC · pasada ${track} · par ${a} → ${b}` +
      (s1 ? ' · Copernicus Sentinel-1 (banda C, VV/VH) procesado con ASF HyP3' : '') +
      ' · Perímetros: EFFIS · Infraestructuras: © OpenStreetMap',
    close: 'Salir',
    next: 'Siguiente →',
    explore: 'Explorar',
    titleHH: 'Polarización HH: sensible al agua y al suelo',
    titleHV: 'Polarización HV: sensible al volumen de vegetación',
    titleRGB: 'Falso color: R=HH, G=HV, B=HH/HV',
  },
  en: {
    kicker: 'NASA Space Apps 2026 · Dancing with the SARs',
    title1: 'SPAIN',
    title2: 'THROUGH RADAR',
    tagline: 'Floods and wildfires of 2026 seen by <strong>NISAR</strong>, the radar that sees through clouds and smoke.',
    incidents: '2026 incidents',
    story: '▶ Watch the story',
    back: '← Back to globe',
    flood: 'Flood',
    fire: 'Wildfire',
    radarView: 'Radar view',
    compare: 'Before / after',
    timeline: 'Time series',
    change: 'Change',
    bandL: 'L-band · NISAR',
    bandC: 'C-band · Sentinel-1',
    maskWater: 'Water mask',
    maskBurn: 'Burn mask',
    infra: 'Affected rail & roads',
    effis: 'Official EFFIS perimeter',
    opacity: 'Radar opacity',
    hintCompare: 'Drag the vertical bar on the map to compare before and after.',
    hintTimeline: 'One image every 12 days: press ▶ to watch the surface “dance”.',
    hintChange: 'Blue: signal drops (new water or lost vegetation). Red: signal rises.',
    chart: 'Radar signal in the affected area (dB)',
    why: 'Why does it look like this?',
    who: 'Who it helps',
    passes: 'Radar passes over the area',
    legendL: 'NISAR (L-band)',
    legendC: 'Sentinel-1 C/D (C-band)',
    legendEv: 'Storm',
    gap: (d: string) => `${d} days without radar`,
    before: 'BEFORE',
    after: 'AFTER',
    pre: 'before',
    post: 'after',
    mock: 'MOCK DATA · real NISAR data pending',
    source: (track: number, a: string, b: string, s1: boolean) =>
      `Data: NASA-ISRO NISAR L2 GCOV (L-band, HH/HV) via ASF DAAC · track ${track} · pair ${a} → ${b}` +
      (s1 ? ' · Copernicus Sentinel-1 (C-band, VV/VH) processed with ASF HyP3' : '') +
      ' · Perimeters: EFFIS · Infrastructure: © OpenStreetMap',
    close: 'Close',
    next: 'Next →',
    explore: 'Explore',
    titleHH: 'HH polarization: sensitive to water and soil',
    titleHV: 'HV polarization: sensitive to vegetation volume',
    titleRGB: 'False colour: R=HH, G=HV, B=HH/HV',
  },
}

type UIKeys = keyof (typeof UI)['es']
export const t = <K extends UIKeys>(k: K): (typeof UI)['es'][K] => UI[lang][k] as (typeof UI)['es'][K]

/** Etiquetas de métricas por id (el manifest las trae en español) */
const METRICS: Record<string, { es: string; en: string }> = {
  area_flood: { es: 'Agua nueva detectada', en: 'New water detected' },
  area_fire: { es: 'Superficie quemada (radar)', en: 'Burned area (radar)' },
  hvdrop: { es: 'Caída media de HV', en: 'Mean HV drop' },
  effis: { es: 'De lo detectado, dentro del perímetro EFFIS', en: 'Of detected area, inside EFFIS perimeter' },
  rail_flood: { es: 'Vía férrea en zona inundada', en: 'Railway in flooded area' },
  roads_flood: { es: 'Carreteras en zona inundada', en: 'Roads in flooded area' },
  rail_fire: { es: 'Distancia de la vía férrea a la zona quemada', en: 'Distance from railway to burned area' },
  roads_fire: { es: 'Carreteras en zona quemada confirmada', en: 'Roads in confirmed burned area' },
}
export const metricLabel = (id: string, kind: string, fallback: string) =>
  (METRICS[`${id}_${kind}`] ?? METRICS[id])?.[lang] ?? fallback
