// Catalogue of surface hazards that radar (NISAR, Sentinel-1) can monitor.
// "live" hazards have a full case study in the app; "planned" ones are documented
// here and can be turned into a case by adding an entry to pipeline/config.py.
import type { Kind } from './types'
import { ICON } from './icons'
import { lang } from './i18n'

export interface Hazard {
  id: Kind
  icon: string
  color: string
  name: string
  status: 'live' | 'planned'
  /** Caso de estudio de la app que lo ilustra */
  caseId?: string
  tagline: string
  signature: string
  technique: string
  products: string
  who: string
}

export const HAZARDS: Hazard[] = [
  {
    id: 'fire',
    caseId: 'niebla',
    icon: ICON.fire,
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
    caseId: 'dana',
    icon: ICON.flood,
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
    caseId: 'granada',
    icon: ICON.earthquake,
    color: '#f472b6',
    name: 'Earthquake',
    status: 'live',
    tagline: 'Centimetre-scale ground displacement along the fault.',
    signature: 'The interferometric phase changes between two passes (coseismic interferogram); each fringe is about half a wavelength of line-of-sight motion. Damaged buildings also lose coherence.',
    technique: 'InSAR from NISAR GUNW pairs, plus coherence-loss damage proxy maps.',
    products: 'NISAR L2 GUNW (three geometries), EMSC / USGS earthquake catalogue. Damage proxy maps from coherence loss where buildings collapse.',
    who: 'Seismologists, search-and-rescue coordination, structural engineers, reconstruction agencies.',
  },
  {
    id: 'landslide',
    caseId: 'alora',
    icon: ICON.landslide,
    color: '#a3e635',
    name: 'Landslide',
    status: 'live',
    tagline: 'Slow slope creep before failure, and scars after it.',
    signature: 'Persistent line-of-sight velocity on slopes before failure; abrupt backscatter and coherence change where the slide scar and debris appear.',
    technique: 'Time-series InSAR (SBAS / PS) for creep, change detection for new scars.',
    products: 'NISAR L2 GUNW, Sentinel-1 RTC for the failure itself, EGMS (Europe) or OPERA DISP (North America), OpenStreetMap rail.',
    who: 'Geological surveys, road and rail operators, mountain municipalities.',
  },
  {
    id: 'volcano',
    caseId: 'lapalma',
    icon: ICON.volcano,
    color: '#ef4444',
    name: 'Volcanic unrest',
    status: 'live',
    tagline: 'Inflation of the edifice before eruptions; lava and ash after.',
    signature: 'Ground uplift or subsidence rings around the volcano in InSAR; new lava flows and deposits change roughness and backscatter.',
    technique: 'InSAR time series, deformation source modelling (Mogi), backscatter change for flows.',
    products: 'NISAR L2 GUNW in two geometries, lava-flow outline (OpenStreetMap), Sentinel-1 / COMET LiCSAR, Smithsonian GVP.',
    who: 'Volcano observatories, aviation authorities, local civil protection.',
  },
  {
    id: 'subsidence',
    caseId: 'lorca',
    icon: ICON.subsidence,
    color: '#c084fc',
    name: 'Land subsidence',
    status: 'live',
    tagline: 'Slow sinking from groundwater pumping, mining or tunnelling.',
    signature: 'A steady line-of-sight velocity trend, from millimetres to centimetres per year, over aquifers, cities, mines, dams and embankments. With a few months of NISAR data only centimetre-per-year rates stand out.',
    technique: 'Chained 12-day interferograms summed into a cumulative time series (SBAS / persistent scatterers on longer series).',
    products: 'NISAR L2 GUNW, Sentinel-1, EGMS (Europe), OPERA DISP (North America).',
    who: 'Water agencies, city planners, dam and railway asset managers.',
  },
]

type HazardText = Pick<Hazard, 'name' | 'tagline' | 'signature' | 'technique' | 'products' | 'who'>

/** Textos en español; icono, color y estado se comparten con la versión inglesa */
const HAZARDS_ES: Record<string, HazardText> = {
  fire: {
    name: 'Incendio forestal',
    tagline: 'Cicatrices del fuego medidas a través del humo y las nubes.',
    signature: 'La retrodispersión HV cae donde se pierde el volumen del dosel, mientras HH se mantiene más o menos estable (troncos y suelo siguen devolviendo señal).',
    technique: 'Detección de cambio antes/después sobre gamma0 con filtro de speckle (HH, HV).',
    products: 'NISAR L2 GCOV, Sentinel-1 RTC. Validación: perímetros de EFFIS / Copernicus EMS.',
    who: 'Servicios forestales, protección civil, planificación de la erosión y el riesgo de inundación tras el fuego.',
  },
  flood: {
    name: 'Inundación',
    tagline: 'Agua en superficie vista de día y de noche, bajo las nubes de tormenta.',
    signature: 'El agua lisa refleja el pulso lejos del satélite, así que las zonas inundadas se ven muy oscuras (HH/VV bajos).',
    technique: 'Umbral de Otsu más una caída respecto a la imagen anterior al evento.',
    products: 'NISAR L2 GCOV, Sentinel-1 RTC. Infraestructuras de OpenStreetMap.',
    who: 'Gestores de emergencias, operadores ferroviarios y de carreteras, aseguradoras.',
  },
  earthquake: {
    name: 'Terremoto',
    tagline: 'Desplazamientos del terreno de escala centimétrica a lo largo de la falla.',
    signature: 'La fase interferométrica cambia entre dos pasadas (interferograma cosísmico); cada franja equivale a media longitud de onda de movimiento en la línea de visión. Los edificios dañados también pierden coherencia.',
    technique: 'InSAR con pares NISAR GUNW, más mapas de daño a partir de la pérdida de coherencia.',
    products: 'NISAR L2 GUNW (tres geometrías), catálogo sísmico EMSC / USGS. Mapas de daño por pérdida de coherencia donde caen edificios.',
    who: 'Sismólogos, coordinación de búsqueda y rescate, ingenieros de estructuras, agencias de reconstrucción.',
  },
  landslide: {
    name: 'Deslizamiento de ladera',
    tagline: 'Reptación lenta de la ladera antes de romper, y la cicatriz después.',
    signature: 'Velocidad persistente en la línea de visión sobre laderas antes de la rotura; cambio brusco de retrodispersión y coherencia donde aparecen la cicatriz y los derrubios.',
    technique: 'InSAR en serie temporal (SBAS / PS) para la reptación, detección de cambio para las nuevas cicatrices.',
    products: 'NISAR L2 GUNW, Sentinel-1 RTC para la rotura, EGMS (Europa) u OPERA DISP (Norteamérica), vías de OpenStreetMap.',
    who: 'Servicios geológicos, operadores de carreteras y ferrocarril, municipios de montaña.',
  },
  volcano: {
    name: 'Actividad volcánica',
    tagline: 'Hinchamiento del edificio antes de la erupción; lava y ceniza después.',
    signature: 'Anillos de levantamiento o hundimiento alrededor del volcán en InSAR; las nuevas coladas y depósitos cambian la rugosidad y la retrodispersión.',
    technique: 'Series temporales InSAR, modelado de la fuente de deformación (Mogi), cambio de retrodispersión para las coladas.',
    products: 'NISAR L2 GUNW en dos geometrías, contorno de la colada (OpenStreetMap), Sentinel-1 / COMET LiCSAR, Smithsonian GVP.',
    who: 'Observatorios vulcanológicos, autoridades de aviación, protección civil local.',
  },
  subsidence: {
    name: 'Subsidencia del terreno',
    tagline: 'Hundimiento lento por bombeo de agua subterránea, minería o túneles.',
    signature: 'Una tendencia constante de velocidad en la línea de visión, de milímetros a centímetros al año, sobre acuíferos, ciudades, minas, presas y terraplenes. Con pocos meses de NISAR solo destacan los centímetros por año.',
    technique: 'Interferogramas de 12 días encadenados y sumados en una serie acumulada (SBAS / dispersores persistentes en series más largas).',
    products: 'NISAR L2 GUNW, Sentinel-1, EGMS (Europa), OPERA DISP (Norteamérica).',
    who: 'Agencias del agua, urbanistas, gestores de presas e infraestructura ferroviaria.',
  },
}

/** Guía de riesgos en el idioma activo */
export const getHazards = (): Hazard[] => (lang === 'es' ? HAZARDS.map((h) => ({ ...h, ...HAZARDS_ES[h.id] })) : HAZARDS)

export const hazardMeta = (k: Kind) => getHazards().find((h) => h.id === k)!
