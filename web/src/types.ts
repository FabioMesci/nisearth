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
  overlays: { rail?: string; roads?: string; effis?: string }
  /** Sentinel-1 (banda C): hh/hv contienen VV/VH */
  s1?: { pair: { before: string; after: string }; frames: Frame[]; change: string; delta_in_mask: { vv: number; vh: number } }
  nisar_delta_in_mask?: { hh: number; hv: number }
  stats?: Record<string, unknown>
}

export type Sensor = 'L' | 'C'

export type LayerMode = 'hh' | 'hv' | 'rgb' | 'change' | 'mask'
