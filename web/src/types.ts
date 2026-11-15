export type Kind = 'flood' | 'fire' | 'earthquake' | 'landslide' | 'volcano' | 'subsidence'

export interface CaseIndexItem {
  id: string
  title: string
  kind: Kind
  center: [number, number]
  event: string
}

export interface Frame {
  date: string
  track: number
  /** InSAR: fecha de la primera pasada del par y sentido (A/D) */
  ref?: string
  dir?: string
  hh: string
  hv: string
  rgb?: string
}

export interface Metric {
  id: string
  label: string
  value: number
  unit: string
}

export interface Manifest {
  id: string
  title: string
  kind: Kind
  event: string
  mock?: boolean
  bbox: [number, number, number, number]
  center: [number, number]
  coordinates: [[number, number], [number, number], [number, number], [number, number]]
  pair: { before: string; after: string }
  frames: Frame[]
  layers: { mask?: string; change?: string; flood_t100?: string }
  series: { dates: string[]; hh: number[]; hv: number[] }
  metrics: Metric[]
  overlays: { rail?: string; roads?: string; effis?: string; ems?: string; firms?: string; risk?: string; events?: string; ref?: string }
  /** Interferometría (pipeline/08_insar.py): frames hh = desplazamiento, hv = franjas, rgb = coherencia */
  insar?: InsarInfo
  /** Texto de la referencia externa (validación) para el pie de fuentes */
  refLabel?: string
  /** Risk index per grid cell (pipeline/07_risk.py) */
  risk?: RiskSummary
  /** Serie diaria externa: lluvia (Open-Meteo) o nº de focos (FIRMS) */
  daily?: { kind: 'rain' | 'firms'; dates: string[]; values: number[]; unit: string; source: string; place?: string }
  firms?: { from: string; to: string; count: number; in_mask_pct: number }
  /** Sentinel-1 (banda C): hh/hv contienen VV/VH */
  s1?: { pair: { before: string; after: string }; frames: Frame[]; change: string; delta_in_mask: { vv: number; vh: number } }
  nisar_delta_in_mask?: { hh: number; hv: number }
  stats?: Record<string, unknown>
  /** Cobertura del suelo bajo la máscara (ESA WorldCover) */
  landcover?: { source: string; inside: LandRow[]; outside_ref?: LandRow[] }
  /** Población expuesta (WorldPop) */
  exposure?: { source: string; pop_inside: number; pop_1km?: number }
}

export interface InsarInfo {
  mode: 'pairs' | 'chain'
  product: string
  wavelength_cm: number
  vmax_cm: number
  fringe_cm: number
  hotspot: [number, number]
  noise_cm: number
  rate_cm_yr?: number | null
  /** point = disco alrededor del punto; region = zona (colada, vía) menos un anillo de 1 km */
  series?: 'point' | 'region'
  threshold_cm: number
  days: number
  start: string
  end: string
  pairs: { track: number; dir: string; ref: string; sec: string }[]
}

export interface RiskSummary {
  generated: string
  model: string
  scenario?: 'snczi_t100_limited'
  cell_m: [number, number]
  cells: number
  classes: { cls: string; cells: number; area_ha: number; population: number }[]
  pop_high: number
  pop_high_range: [number, number]
  pop_expected: number
  roads_high_km: number
  rail_high_km: number
  critical_high: number
  components: { hazard: number; exposure: number; vulnerability: number }
  drivers: { exposure: Record<string, number>; vulnerability: Record<string, number> }
  hotspots: { place: string; lon: number; lat: number; risk: number; class: string; population: number }[]
  cascade?: { type: 'post_fire_runoff' | 'rain_slope_failure'; cells: number; roads_km: number; rail_km: number; burned_steep_ha?: number; rain_mm?: number }
  stability: { runs: number; spread_pct: number; stable_high_pct: number | null; mean_pct: number }
  sources: string[]
  files: { geojson: string; csv: string }
}

export interface LandRow {
  cls: string
  ha: number
  pct: number
}

export type Sensor = 'L' | 'C'

export type LayerMode = 'hh' | 'hv' | 'rgb' | 'change' | 'mask'

export interface WatchPass {
  track: number
  dir: 'asc' | 'desc'
  next: string
}

export interface WatchFire {
  lat: number
  lng: number
  n: number
  frp: number
  first: string
  last: string
  pts: [number, number][]
  passes: WatchPass[]
  town: string
  region: string
  cc: string
}

/** Vigilancia España: incendios activos (FIRMS) + próxima pasada NISAR */
export interface Watch {
  generated: string
  repeat_days: number
  hotspots: number
  industrial: number
  tracks_total: number
  fires: WatchFire[]
  tracks: (WatchPass & { geom: { type: 'Polygon'; coordinates: number[][][] } | { type: 'MultiPolygon'; coordinates: number[][][][] } })[]
}
