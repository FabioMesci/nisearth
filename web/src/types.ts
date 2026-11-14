export type Kind = 'flood' | 'fire'

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
  layers: { mask?: string; change?: string }
  series: { dates: string[]; hh: number[]; hv: number[] }
  metrics: Metric[]
  overlays: { rail?: string; roads?: string; effis?: string; firms?: string }
  /** Serie diaria externa: lluvia (Open-Meteo) o nº de focos (FIRMS) */
  daily?: { kind: 'rain' | 'firms'; dates: string[]; values: number[]; unit: string; source: string; place?: string }
  firms?: { from: string; to: string; count: number; in_mask_pct: number }
  /** Sentinel-1 (banda C): hh/hv contienen VV/VH */
  s1?: { pair: { before: string; after: string }; frames: Frame[]; change: string; delta_in_mask: { vv: number; vh: number } }
  nisar_delta_in_mask?: { hh: number; hv: number }
  stats?: Record<string, unknown>
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
