// Textos editoriales de cada caso. El equipo puede reescribirlos libremente.
// Las cifras salen del pipeline (manifest.json); aquí solo va la narrativa.
import type { Kind } from './types'
import { lang, t } from './i18n'

export interface Pass {
  date: string // ISO con hora UTC
  sensor: 'NISAR' | 'S1C' | 'S1D'
}

export interface CaseContent {
  place: string
  dateLabel: string
  headline: string
  summary: string
  why: { title: string; text: string }[]
  who: { title: string; text: string }[]
  /** Marcas en el gráfico de la serie temporal */
  notes?: { date: string; label: string }[]
  /** Pasadas de radar alrededor del evento (para la línea de revisita) */
  passes?: { from: string; to: string; event: [string, string]; list: Pass[] }
  order: number
}

const META = {
  flood: { icon: '💧', color: '#38bdf8' },
  fire: { icon: '🔥', color: '#fb923c' },
}
export const KIND_META = new Proxy({} as Record<Kind, { icon: string; color: string; label: string }>, {
  get: (_, k: Kind) => ({ ...META[k], label: t(k) }),
})

const CONTENT_ES: Record<string, CaseContent> = {
  niebla: {
    order: 1,
    place: 'Niebla (Huelva)',
    dateLabel: '7–15 ago 2026',
    headline: 'Niebla: lo que el fuego se llevó',
    summary:
      'Uno de los mayores incendios de 2026 en España. NISAR midió la cicatriz a través del humo: la señal HV, que rebota en hojas y ramas, se desplomó en toda la zona quemada, y tres meses después la vegetación sigue sin recuperarse.',
    notes: [
      { date: '2026-08-07', label: 'Incendio' },
      { date: '2026-09-07', label: 'Lluvia' },
    ],
    why: [
      {
        title: 'HV mide el volumen de vegetación',
        text: 'En la polarización cruzada (HV) la señal vuelve tras rebotar muchas veces entre hojas y ramas. Cuando el bosque arde, ese rebote desaparece y HV cae.',
      },
      {
        title: 'Fuego ≠ cosecha: la clave está en HH',
        text: 'El fuego hace caer HV pero no HH (troncos y suelo siguen devolviendo señal). La cosecha y el arado cambian toda la superficie y hacen caer las dos. Con esta regla física, el 89 % de lo que detectamos cae dentro del perímetro oficial de EFFIS.',
      },
      {
        title: 'El pico de septiembre: agua sobre ceniza',
        text: 'El 7 de septiembre HH y HV suben de golpe: el suelo quemado y desnudo, empapado por la lluvia, refleja mucho más. Después vuelven a bajar: la vegetación no se recupera.',
      },
      {
        title: 'Banda L frente a banda C',
        text: 'La banda L de NISAR (24 cm) atraviesa el dosel hasta troncos y suelo; la banda C de Sentinel-1 (5,5 cm) se queda en las copas. Cada una ve una capa distinta del bosque quemado.',
      },
    ],
    who: [
      { title: 'Gestión forestal', text: 'Perímetro y severidad sin esperar a imágenes ópticas sin humo ni nubes.' },
      { title: 'Prevención de riesgos', text: 'Suelo quemado = más escorrentía y erosión: dónde actuar antes de las lluvias de otoño.' },
      { title: 'Infraestructuras', text: 'Carreteras dentro del área quemada y vía férrea a menos de 1 km, aguas abajo.' },
    ],
  },
  dana: {
    order: 2,
    place: 'La Safor · Oliva (Valencia)',
    dateLabel: '18–19 oct 2026',
    headline: 'DANA Adam: lo que el radar no llegó a ver',
    summary:
      'Cientos de litros por metro cuadrado en una noche sobre la costa de Oliva: campings evacuados, Cercanías C1 suspendida y carreteras cortadas. Pero ningún radar pasó durante la tormenta. Cuando NISAR volvió, cuatro días después, el agua ya había drenado casi por completo.',
    passes: {
      from: '2026-10-09',
      to: '2026-10-29',
      event: ['2026-10-18T12:00', '2026-10-19T18:00'],
      list: [
        { date: '2026-10-10T06:09', sensor: 'S1D' },
        { date: '2026-10-10T18:01', sensor: 'S1C' },
        { date: '2026-10-11T06:01', sensor: 'S1C' },
        { date: '2026-10-11T17:53', sensor: 'S1D' },
        { date: '2026-10-11T19:01', sensor: 'NISAR' },
        { date: '2026-10-16T05:06', sensor: 'NISAR' },
        { date: '2026-10-16T06:09', sensor: 'S1C' },
        { date: '2026-10-16T18:01', sensor: 'S1D' },
        { date: '2026-10-16T18:53', sensor: 'NISAR' },
        { date: '2026-10-17T06:01', sensor: 'S1D' },
        { date: '2026-10-17T17:53', sensor: 'S1C' },
        { date: '2026-10-22T06:09', sensor: 'S1D' },
        { date: '2026-10-23T06:01', sensor: 'S1C' },
        { date: '2026-10-23T17:53', sensor: 'S1D' },
        { date: '2026-10-23T19:01', sensor: 'NISAR' },
        { date: '2026-10-28T05:06', sensor: 'NISAR' },
        { date: '2026-10-28T06:09', sensor: 'S1C' },
        { date: '2026-10-28T18:01', sensor: 'S1D' },
        { date: '2026-10-28T18:53', sensor: 'NISAR' },
      ],
    },
    notes: [{ date: '2026-10-19', label: 'DANA' }],
    why: [
      {
        title: 'El agua es un espejo',
        text: 'Una lámina de agua refleja el pulso del radar lejos del satélite: las zonas inundadas aparecen muy oscuras en HH. NISAR aún detecta agua residual junto al Marjal de Pego-Oliva.',
      },
      {
        title: 'Una inundación relámpago drena en horas',
        text: 'Con suelos en pendiente y barrancos, el agua de la DANA llegó al mar en horas o pocos días. Una imagen cada 12 días no basta para captar el pico.',
      },
      {
        title: 'Lo que no se ve también es un resultado',
        text: 'Entre el 17 y el 22 de octubre no pasó ningún radar (ni NISAR ni Sentinel-1) sobre La Safor. Coordinar las constelaciones radar en emergencias reduciría ese hueco.',
      },
    ],
    who: [
      { title: 'Protección Civil', text: 'Programar adquisiciones de radar urgentes cuando AEMET emite aviso rojo.' },
      { title: 'Agencias espaciales', text: 'Coordinar NISAR, Sentinel-1 y otras misiones para no dejar huecos durante el evento.' },
      { title: 'Adif · Renfe', text: 'Con revisita suficiente: tramos de vía bajo el agua para priorizar inspecciones.' },
    ],
  },
}

const STORY_ES = [
  {
    title: 'Gelida, 20 de enero de 2026',
    text: 'Tras días de lluvia intensa, un muro de contención cede por el empuje del agua y cae sobre la vía de Rodalies. Muere un maquinista en prácticas y la red catalana queda paralizada. Agua, fuego, terreno e infraestructuras: riesgos que se pueden vigilar desde el espacio.',
    target: null as string | null,
  },
  {
    title: 'Verano: el fuego',
    text: '2026 es el segundo peor año de incendios del siglo en España. En Niebla (Huelva) el radar NISAR mide unas 32.000 ha quemadas a través del humo, con un 89 % de coincidencia con el perímetro oficial europeo.',
    target: 'niebla',
  },
  {
    title: 'Otoño: el agua que nadie vio',
    text: 'La DANA Adam descarga cientos de litros sobre La Safor la noche del 18 al 19 de octubre. Ningún radar pasó durante la tormenta: cuando volvieron, el agua ya se había ido.',
    target: 'dana',
  },
  {
    title: 'Lo que puede hacer NISAR',
    text: 'NISAR ve de día y de noche, con nubes o humo, y distingue el fuego de la cosecha gracias a sus polarizaciones. Combinado con otros radares y activado a tiempo, puede convertirse en un sistema de alerta para quien decide.',
    target: null,
  },
]

const CONTENT_EN: Record<string, CaseContent> = {
  niebla: {
    ...CONTENT_ES.niebla,
    place: 'Niebla (Huelva, Spain)',
    dateLabel: '7–15 Aug 2026',
    headline: 'Niebla: what the fire took away',
    summary:
      'One of the largest wildfires of 2026 in Spain. NISAR measured the burn scar through the smoke: the HV signal, which bounces off leaves and branches, collapsed across the burned area — and three months later the vegetation has still not recovered.',
    notes: [
      { date: '2026-08-07', label: 'Fire' },
      { date: '2026-09-07', label: 'Rain' },
    ],
    why: [
      { title: 'HV measures vegetation volume', text: 'In cross-polarization (HV) the signal returns after bouncing many times between leaves and branches. When the forest burns, that bouncing disappears and HV drops.' },
      { title: 'Fire ≠ harvest: HH is the key', text: 'Fire lowers HV but not HH (trunks and soil still scatter back). Harvesting and ploughing change the whole surface and lower both. With this physical rule, 89% of what we detect lies inside the official EFFIS perimeter.' },
      { title: 'The September spike: water on ash', text: 'On 7 September HH and HV jump: bare, burned soil soaked by rain reflects much more. Then they drop again — the vegetation is not coming back.' },
      { title: 'L-band vs C-band', text: 'NISAR’s L-band (24 cm) penetrates the canopy down to trunks and soil; Sentinel-1’s C-band (5.5 cm) stays in the treetops. Each sees a different layer of the burned forest.' },
    ],
    who: [
      { title: 'Forest management', text: 'Burn perimeter and severity without waiting for smoke- and cloud-free optical images.' },
      { title: 'Risk prevention', text: 'Burned soil = more runoff and erosion: where to act before the autumn rains.' },
      { title: 'Infrastructure', text: 'Roads inside the burned area and a railway less than 1 km downstream.' },
    ],
  },
  dana: {
    ...CONTENT_ES.dana,
    place: 'La Safor · Oliva (Valencia, Spain)',
    dateLabel: '18–19 Oct 2026',
    headline: 'Storm “Adam”: what the radar never saw',
    summary:
      'Hundreds of litres per square metre in one night on the coast of Oliva: campsites evacuated, the C1 commuter line suspended, roads cut. But no radar passed over during the storm. When NISAR came back four days later, the water had almost entirely drained away.',
    notes: [{ date: '2026-10-19', label: 'Storm' }],
    why: [
      { title: 'Water is a mirror', text: 'A sheet of water reflects the radar pulse away from the satellite: flooded areas look very dark in HH. NISAR still detects residual water next to the Pego-Oliva marshland.' },
      { title: 'A flash flood drains in hours', text: 'With steep slopes and ravines, the storm water reached the sea within hours or a few days. One image every 12 days cannot catch the peak.' },
      { title: 'What is not seen is also a result', text: 'Between 17 and 22 October no radar (neither NISAR nor Sentinel-1) passed over La Safor. Coordinating radar constellations during emergencies would close that gap.' },
    ],
    who: [
      { title: 'Civil protection', text: 'Request urgent radar acquisitions when the weather service issues a red warning.' },
      { title: 'Space agencies', text: 'Coordinate NISAR, Sentinel-1 and other missions so no gap is left during the event.' },
      { title: 'Rail operators', text: 'With enough revisits: flooded track sections to prioritise inspections.' },
    ],
  },
}

const STORY_EN = [
  { title: 'Gelida, 20 January 2026', text: 'After days of heavy rain, a retaining wall gives way under water pressure and falls onto the Rodalies commuter line near Barcelona. A trainee driver dies and the Catalan rail network grinds to a halt. Water, fire, terrain and infrastructure: risks that can be watched from space.', target: null as string | null },
  { title: 'Summer: fire', text: '2026 is Spain’s second-worst wildfire year of the century. In Niebla (Huelva) NISAR measures about 32,000 ha burned through the smoke, with 89% agreement with the official European perimeter.', target: 'niebla' },
  { title: 'Autumn: the water nobody saw', text: 'Storm “Adam” dumps hundreds of litres on La Safor on the night of 18–19 October. No radar passed during the storm: by the time they came back, the water was gone.', target: 'dana' },
  { title: 'What NISAR can do', text: 'NISAR sees day and night, through clouds and smoke, and tells fire from harvest thanks to its polarizations. Combined with other radars and tasked in time, it can become a warning system for decision-makers.', target: null },
]

export const CONTENT = new Proxy({} as Record<string, CaseContent>, {
  get: (_, id: string) => (lang === 'en' ? CONTENT_EN : CONTENT_ES)[id],
})
export const getStory = () => (lang === 'en' ? STORY_EN : STORY_ES)
