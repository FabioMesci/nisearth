// Catalogue of surface hazards that radar (NISAR, Sentinel-1) can monitor.
// "live" hazards have a full case study in the app; "planned" ones are documented
// here and can be turned into a case by adding an entry to pipeline/config.py.
import type { Kind } from './types'

export interface Hazard {
  id: Kind
  icon: string
  color: string
  name: string
  status: 'live' | 'planned'
  tagline: string
  signature: string
  technique: string
  products: string
  who: string
}

export const HAZARDS: Hazard[] = [
  {
    id: 'fire',
    icon: '🔥',
    color: '#fb923c',
    name: 'Wildfire',
    status: 'live',
    tagline: 'Burn scars measured through smoke and cloud.',
    signature: 'HV backscatter drops where canopy volume is lost, while HH stays roughly stable (trunks and soil still scatter back).',
    technique: 'Before/after change detection on speckle-filtered gamma0 (HH, HV).',
    products: 'NISAR L2 GCOV, Sentinel-1 RTC. Validation: EFFIS / Copernicus EMS perimeters.',
    who: 'Forest services, civil protection, post-fire erosion and flood-risk planners.',
  },
  {
    id: 'flood',
    icon: '💧',
    color: '#38bdf8',
    name: 'Flood',
    status: 'live',
    tagline: 'Open water seen day and night, under storm clouds.',
    signature: 'Smooth water reflects the pulse away from the satellite, so flooded areas turn very dark (low HH/VV).',
    technique: 'Otsu thresholding plus a drop versus the pre-event image.',
    products: 'NISAR L2 GCOV, Sentinel-1 RTC. Infrastructure from OpenStreetMap.',
    who: 'Emergency managers, rail and road operators, insurers.',
  },
  {
    id: 'earthquake',
    icon: '🌍',
    color: '#f472b6',
    name: 'Earthquake',
    status: 'planned',
    tagline: 'Centimetre-scale ground displacement along the fault.',
    signature: 'The interferometric phase changes between two passes (coseismic interferogram); each fringe is about half a wavelength of line-of-sight motion. Damaged buildings also lose coherence.',
    technique: 'InSAR from NISAR GUNW pairs, plus coherence-loss damage proxy maps.',
    products: 'NISAR L2 GUNW / GSLC, ARIA damage proxy maps, USGS ShakeMap and event catalogue.',
    who: 'Seismologists, search-and-rescue coordination, structural engineers, reconstruction agencies.',
  },
  {
    id: 'landslide',
    icon: '⛰️',
    color: '#a3e635',
    name: 'Landslide',
    status: 'planned',
    tagline: 'Slow slope creep before failure, and scars after it.',
    signature: 'Persistent line-of-sight velocity on slopes before failure; abrupt backscatter and coherence change where the slide scar and debris appear.',
    technique: 'Time-series InSAR (SBAS / PS) for creep, change detection for new scars.',
    products: 'NISAR L2 GUNW / GCOV, Sentinel-1 (OPERA DISP / EGMS in Europe), DEM slope maps.',
    who: 'Geological surveys, road and rail operators, mountain municipalities.',
  },
  {
    id: 'volcano',
    icon: '🌋',
    color: '#ef4444',
    name: 'Volcanic unrest',
    status: 'planned',
    tagline: 'Inflation of the edifice before eruptions; lava and ash after.',
    signature: 'Ground uplift or subsidence rings around the volcano in InSAR; new lava flows and deposits change roughness and backscatter.',
    technique: 'InSAR time series, deformation source modelling (Mogi), backscatter change for flows.',
    products: 'NISAR L2 GUNW, Sentinel-1, COMET LiCSAR, Smithsonian GVP eruption records.',
    who: 'Volcano observatories, aviation authorities, local civil protection.',
  },
  {
    id: 'subsidence',
    icon: '🏗️',
    color: '#c084fc',
    name: 'Land subsidence',
    status: 'planned',
    tagline: 'Slow sinking from groundwater pumping, mining or tunnelling.',
    signature: 'A steady millimetre-per-year line-of-sight velocity trend over urban areas, aquifers, mines, dams and embankments.',
    technique: 'Persistent-scatterer / SBAS InSAR on long time series.',
    products: 'NISAR L2 GUNW, Sentinel-1, EGMS (Europe), OPERA DISP.',
    who: 'Water agencies, city planners, dam and railway asset managers.',
  },
]

export const hazardMeta = (k: Kind) => HAZARDS.find((h) => h.id === k)!
