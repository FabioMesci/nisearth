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
    firms: 'Focos de calor NASA FIRMS',
    firmsChart: 'Focos de calor detectados por día (NASA FIRMS)',
    firmsNote: (p: number) => `Satélites VIIRS (375 m) vieron el fuego activo día a día. El ${p} % de esos focos cae dentro de la cicatriz que midió NISAR: dos sensores independientes cuentan la misma historia.`,
    rainChart: (p: string) => `Lluvia diaria en ${p} (mm)`,
    rainNote: 'Las barras blancas son las dos pasadas de NISAR: toda la tormenta cae entre ellas. Reanálisis ERA5 (celda de ~25 km): suaviza los picos locales.',
    hotspots: 'focos',
    srcFirms: 'Focos de calor: NASA FIRMS (VIIRS)',
    srcRain: 'Lluvia: Open-Meteo / ERA5',
    watch: 'Vigilancia España · ahora',
    watchSub: (n: number, ind: number) => `Fuegos activos detectados por NASA FIRMS (5 días; ${n} focos, ${ind} industriales descartados) y cuándo pasará NISAR por encima (ciclo de 12 días de cada pista).`,
    track: 'pista',
    nisarNext: 'NISAR prevista',
    today: 'hoy',
    tomorrow: 'mañana',
    inDays: (n: number, d: string) => `en ${n} días (${d})`,
    passDone: 'pasada reciente',
    noPass: 'sin pasada NISAR',
    noFires: 'Ningún incendio activo en la Península ahora mismo.',
    watchExample: 'Así funcionó en Niebla: FIRMS detectó el fuego el 6 ago y NISAR pasó el 14 ago (pista 23) midiendo la cicatriz a través del humo.',
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
    firms: 'NASA FIRMS hotspots',
    firmsChart: 'Hotspots detected per day (NASA FIRMS)',
    firmsNote: (p: number) => `VIIRS satellites (375 m) saw the active fire day by day. ${p}% of those hotspots fall inside the scar NISAR measured: two independent sensors tell the same story.`,
    rainChart: (p: string) => `Daily rainfall in ${p} (mm)`,
    rainNote: 'White bars are the two NISAR passes: the whole storm falls between them. ERA5 reanalysis (~25 km cell): smooths local peaks.',
    hotspots: 'hotspots',
    srcFirms: 'Hotspots: NASA FIRMS (VIIRS)',
    srcRain: 'Rainfall: Open-Meteo / ERA5',
    watch: 'Spain watch · now',
    watchSub: (n: number, ind: number) => `Active fires detected by NASA FIRMS (5 days; ${n} hotspots, ${ind} industrial removed) and when NISAR will pass over them (12-day cycle per track).`,
    track: 'track',
    nisarNext: 'NISAR due',
    today: 'today',
    tomorrow: 'tomorrow',
    inDays: (n: number, d: string) => `in ${n} days (${d})`,
    passDone: 'recent pass',
    noPass: 'no NISAR pass',
    noFires: 'No active fires on the Peninsula right now.',
    watchExample: 'How it worked in Niebla: FIRMS detected the fire on 6 Aug and NISAR passed on 14 Aug (track 23), measuring the scar through the smoke.',
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
  firms_in: { es: 'Focos FIRMS dentro de la zona quemada (radar)', en: 'FIRMS hotspots inside radar burn scar' },
  rain: { es: 'Lluvia entre las dos pasadas NISAR', en: 'Rain between the two NISAR passes' },
  roads_fire: { es: 'Carreteras en zona quemada confirmada', en: 'Roads in confirmed burned area' },
}
export const metricLabel = (id: string, kind: string, fallback: string) =>
  (METRICS[`${id}_${kind}`] ?? METRICS[id])?.[lang] ?? fallback
