// Textos editoriales de cada caso. El equipo puede reescribirlos libremente.
// Las cifras salen del pipeline (manifest.json); aquí solo va la narrativa.
import type { Kind } from './types'
import { lang, t } from './i18n'
import { ICON } from './icons'

export interface Pass {
  date: string // ISO con hora UTC
  sensor: 'NISAR' | 'S1C' | 'S1D'
}

export interface CaseContent {
  place: string
  /** Nombre corto y provincia para la lista y el globo */
  short: string
  region: string
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
  flood: { icon: ICON.flood, color: '#5cb8f2' },
  fire: { icon: ICON.fire, color: '#ff8a3d' },
  earthquake: { icon: ICON.earthquake, color: '#f472b6' },
  landslide: { icon: ICON.landslide, color: '#a3e635' },
  volcano: { icon: ICON.volcano, color: '#ef4444' },
  subsidence: { icon: ICON.subsidence, color: '#c084fc' },
}
export const KIND_META = new Proxy({} as Record<Kind, { icon: string; color: string; label: string }>, {
  get: (_, k: Kind) => ({ ...META[k], label: t(k) }),
})

const CONTENT_ES: Record<string, CaseContent> = {
  niebla: {
    short: 'Niebla',
    region: 'Huelva',
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
    short: 'La Safor',
    region: 'Valencia',
    order: 2,
    place: 'La Safor · Oliva (Valencia)',
    dateLabel: '18–19 oct 2026',
    headline: 'DANA Adam: lo que el radar no llegó a ver',
    summary:
      'Cientos de litros por metro cuadrado en una noche sobre la costa de Oliva: campings evacuados, Cercanías C1 suspendida y carreteras cortadas. Pero ningún radar pasó durante la tormenta. Cuando NISAR volvió, cuatro días después, el agua ya había drenado casi por completo: de las 885 ha que Copernicus EMS cartografió inundadas el 20 oct, NISAR solo veía como agua el 5 % el 23 oct.',
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
  },  lorca: {
    short: 'Lorca',
    region: 'Murcia',
    order: 3,
    place: 'Alto Guadalentín · Lorca (Murcia)',
    dateLabel: 'jun–oct 2026',
    headline: 'Lorca: el valle que se hunde',
    summary:
      'Décadas de bombeo para regadío han vaciado el acuífero del Alto Guadalentín y el suelo se compacta: es uno de los hundimientos más rápidos de Europa. Sumando 8 interferogramas NISAR de 12 días (25 jun → 11 oct), el punto que más baja, en el llano al sureste de Lorca, se aleja 6 cm del satélite en 108 días. La recta ajustada a la serie da unos 16 cm/año, en línea con los máximos publicados (10–16 cm/año), con un ruido de fondo de ±1,2 cm.',
    why: [
      { title: 'Agua que sale, suelo que baja', text: 'Al bajar el nivel del agua, las arcillas del acuífero pierden presión y se compactan sin vuelta atrás. El radar no ve el agua: ve el suelo bajar, centímetro a centímetro.' },
      { title: 'Sumar pares limpia la atmósfera', text: 'Cada interferograma de 12 días lleva el retraso atmosférico de sus dos fechas. Al encadenarlos, las fechas intermedias se cancelan y solo quedan la primera y la última, mientras el hundimiento real se acumula.' },
      { title: 'La forma del valle', text: 'La cubeta roja es alargada de suroeste a noreste, como el valle del Guadalentín. La bibliografía sitúa el máximo de 2006–2011 unos 4 km al suroeste de Lorca; NISAR lo ve algo más al este, en los cultivos del llano.' },
      { title: 'Una lección de método', text: 'La corrección ionosférica que trae el producto añadía ruido en una escena tan pequeña: con ella el ruido acumulado era de 4,7 cm y la cubeta no se veía. Sin ella, 2,4 cm y la cubeta aparece. Comprobar cada paso importa tanto como el dato.' },
    ],
    who: [
      { title: 'Confederación Hidrográfica del Segura', text: 'Ver, cada 12 días, si las restricciones de bombeo frenan el hundimiento.' },
      { title: 'Urbanismo y protección civil', text: 'Un valle que baja cambia por dónde corre el agua en una riada: más zonas inundables.' },
      { title: 'Infraestructuras', text: 'Carreteras, tuberías y vías que cruzan el valle sufren asientos diferenciales.' },
    ],
  },
  lapalma: {
    short: 'La Palma',
    region: 'Canarias',
    order: 4,
    place: 'Tajogaite · La Palma',
    dateLabel: 'jun–oct 2026',
    headline: 'La Palma: la colada que ya casi no se mueve',
    summary:
      'La erupción de 2021 dejó unas 1.200 ha de lava nueva. En 2022, estudios preliminares midieron hundimientos de hasta 22 cm/año mientras la colada se enfriaba y compactaba. Cinco años después, 9 interferogramas NISAR (23 jun → 21 oct) no encuentran un hundimiento claro: la colada baja unos 0,4 cm frente a su entorno, por debajo del ruido (±1,7 cm). Lo que sí se ve es lo estable que es: la lava tiene una coherencia de 0,86, frente a 0,6 alrededor.',
    why: [
      { title: 'La lava se enfría y se asienta', text: 'Una colada de decenas de metros se contrae al enfriarse y se compacta bajo su propio peso. El ritmo cae con los años: lo que en 2022 eran decenas de centímetros al año, en 2026 ya no supera el ruido de 4 meses de datos.' },
      { title: 'Un espejo perfecto para el radar', text: 'La roca nueva, desnuda y rígida, devuelve la señal casi igual en cada pasada (coherencia 0,86). Las fincas y la vegetación de alrededor cambian más (0,6).' },
      { title: 'El Teide, a vigilar', text: 'En junio de 2026 el IGN registró más de 200 terremotos en un día bajo Las Cañadas y no detectó deformación significativa. La misma técnica aplicada a Tenerife daría la alerta si el edificio empezara a hincharse.' },
      { title: 'Una sola geometría', text: 'Se usa la pasada 131 ascendente. La descendente 81 trae coherencia pero no fase desenrollada sobre la colada, así que no permite contrastar.' },
    ],
    who: [
      { title: 'Cabildo y reconstrucción', text: 'Saber cuándo una colada deja de moverse ayuda a decidir dónde y cuándo volver a construir.' },
      { title: 'IGN e INVOLCAN', text: 'Vigilancia de la deformación en las islas cada 12 días, de día y de noche.' },
      { title: 'Protección civil', text: 'Una línea base estable hace más fácil detectar cualquier cambio futuro.' },
    ],
  },
  granada: {
    short: 'Granada',
    region: 'Vega de Granada',
    order: 5,
    place: 'Santa Fe · Alhendín (Granada)',
    dateLabel: '14–18 ago 2026',
    headline: 'Granada: un terremoto que no dejó huella medible',
    summary:
      'El 14 de agosto un terremoto de magnitud 5,2 (EMSC), a solo 2 km de profundidad, sacudió la Vega de Granada; el 18 llegó otro de 4,9. Tres interferogramas NISAR, desde tres pasadas distintas, abarcan los dos. Ninguno muestra deformación por encima del ruido atmosférico (±0,8 cm): junto al epicentro, las dos pasadas descendentes, que miran casi igual, dan +1,3 y −0,2 cm. El suelo se movió menos de un centímetro a escala de kilómetros.',
    why: [
      { title: 'Una franja son 11,9 cm', text: 'Cada vuelta de color de un interferograma en banda L es media longitud de onda: 11,9 cm hacia o desde el satélite. Un terremoto de magnitud 5 suele mover el suelo pocos milímetros. Aquí las franjas se dibujan cada 2 cm para poder ver algo.' },
      { title: 'Dos miradas iguales, dos respuestas distintas', text: 'Las pasadas 95 y 167 son descendentes y miran desde casi el mismo ángulo. Si el suelo se hubiera movido, verían lo mismo. Ven cosas distintas: es la atmósfera, no el terremoto.' },
      { title: 'Lo que no se ve también acota', text: 'Que NISAR no vea nada significa que no hubo una deformación superficial de más de ~1 cm sobre áreas de kilómetros. Es un dato útil para entender la ruptura.' },
      { title: 'Cómo medirlo mejor', text: 'Sentinel-1 (banda C, franja de 2,8 cm), estaciones GNSS y más pares NISAR para promediar la atmósfera.' },
    ],
    who: [
      { title: 'IGN y sismólogos', text: 'Acotar cuánto se movió la superficie ayuda a modelar la falla.' },
      { title: 'Protección civil', text: 'Descartar en días deformaciones grandes en presas, laderas o carreteras de la zona.' },
      { title: 'Ingeniería', text: 'La coherencia también revela daños: los edificios que colapsan dejan de devolver la misma señal.' },
    ],
  },
  alora: {
    short: 'Álora',
    region: 'Málaga',
    order: 6,
    place: 'Álora (Málaga) · AVE Córdoba–Málaga',
    dateLabel: '4 feb 2026',
    headline: 'Álora: el talud que cedió antes de que llegara NISAR',
    summary:
      'El 4 de febrero, con la borrasca Leonardo, cedió una trinchera del AVE Córdoba–Málaga entre Gobantes y Álora. La conexión directa con Madrid no volvió hasta el 30 de abril, y la segunda vía hasta julio. NISAR no tenía imágenes de la zona hasta el 20 de junio; Sentinel-1 sí pasó la víspera (3 feb) y cinco días después (9 feb). Desde junio, 9 interferogramas NISAR vigilan la vía: frente a su entorno, se mueve menos de 1 mm. El tramo reparado está estable.',
    why: [
      { title: 'NISAR llegó tarde', text: 'Sobre España, los datos públicos de NISAR son densos solo desde junio de 2026. El talud cedió en febrero: como en la DANA, el satélite no estaba cuando hacía falta.' },
      { title: 'Un deslizamiento pequeño', text: 'Una trinchera de unos 5 m de altura ocupa pocos píxeles de 20–30 m. Las noticias no dan el punto exacto, así que no lo marcamos: mostramos el cambio de Sentinel-1 alrededor de la vía (banda C).' },
      { title: 'Estable = coherente', text: 'La coherencia junto a la vía se mantiene en 0,77 todo el verano. Una ladera que se mueve o una obra activa la perderían.' },
      { title: 'Vigilar antes de romper', text: 'Muchas laderas se mueven lentamente antes de fallar. Con series InSAR largas se pueden priorizar los taludes que reptan antes de las lluvias.' },
    ],
    who: [
      { title: 'Adif', text: 'Vigilar milímetro a milímetro los taludes reparados y priorizar los que se mueven.' },
      { title: 'IGME', text: 'Inventario nacional de movimientos del terreno actualizado desde el espacio.' },
      { title: 'Viajeros y economía', text: 'Tres meses sin AVE directo Málaga–Madrid: prevenir sale más barato.' },
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
    title: 'Todo el año: el suelo que se mueve',
    text: 'Con interferometría NISAR mide centímetros. En Lorca el valle se hunde unos 16 cm al año por el bombeo del acuífero. En Granada, La Palma y Álora el radar acota lo que no se movió: un terremoto de magnitud 5,2 que no deformó el suelo más de 1 cm, una colada que ya casi no se asienta y un talud de AVE estable tras su reparación.',
    target: 'lorca',
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
      'Hundreds of litres per square metre in one night on the coast of Oliva: campsites evacuated, the C1 commuter line suspended, roads cut. But no radar passed over during the storm. When NISAR came back four days later, the water had almost entirely drained away: of the 885 ha Copernicus EMS mapped as flooded on 20 Oct, NISAR saw only 5% still under water on 23 Oct.',
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
  },  lorca: {
    ...CONTENT_ES.lorca,
    place: 'Alto Guadalentín · Lorca (Murcia, Spain)',
    dateLabel: 'Jun–Oct 2026',
    headline: 'Lorca: the sinking valley',
    summary:
      'Decades of pumping for irrigation have drained the Alto Guadalentín aquifer and the ground is compacting: one of the fastest subsidence areas in Europe. Adding up 8 NISAR 12-day interferograms (25 Jun → 11 Oct), the fastest spot, on the plain south-east of Lorca, moves 6 cm away from the satellite in 108 days. A line fitted to the series gives about 16 cm/yr, in line with the published maxima (10–16 cm/yr), with ±1.2 cm background noise.',
    why: [
      { title: 'Water out, ground down', text: 'As the water table drops, the aquifer clays lose pressure and compact for good. Radar does not see the water: it sees the ground going down, centimetre by centimetre.' },
      { title: 'Adding pairs cleans the atmosphere', text: 'Each 12-day interferogram carries the atmospheric delay of its two dates. Chaining them cancels the dates in between, leaving only the first and last, while the real subsidence adds up.' },
      { title: 'The shape of the valley', text: 'The red bowl is elongated south-west to north-east, like the Guadalentín valley. Studies place the 2006–2011 maximum about 4 km south-west of Lorca; NISAR sees it somewhat further east, in the farmland on the plain.' },
      { title: 'A lesson in method', text: 'The ionospheric correction shipped with the product added noise in such a small scene: with it the cumulative noise was 4.7 cm and the bowl vanished. Without it, 2.4 cm and the bowl appears. Checking each step matters as much as the data.' },
    ],
    who: [
      { title: 'Segura river basin authority', text: 'See every 12 days whether pumping limits slow the subsidence.' },
      { title: 'Planning and civil protection', text: 'A sinking valley changes where flood water runs: more flood-prone land.' },
      { title: 'Infrastructure', text: 'Roads, pipes and railways crossing the valley suffer uneven settlement.' },
    ],
  },
  lapalma: {
    ...CONTENT_ES.lapalma,
    region: 'Canary Islands',
    place: 'Tajogaite · La Palma (Spain)',
    dateLabel: 'Jun–Oct 2026',
    headline: 'La Palma: the lava flow that has almost stopped moving',
    summary:
      'The 2021 eruption left about 1,200 ha of new lava. In 2022, preliminary studies measured up to 22 cm/yr of subsidence as the flow cooled and compacted. Five years on, 9 NISAR interferograms (23 Jun → 21 Oct) find no clear subsidence: the flow drops about 0.4 cm relative to its surroundings, below the noise (±1.7 cm). What does stand out is how stable it is: coherence on the lava is 0.86, versus 0.6 around it.',
    why: [
      { title: 'Lava cools and settles', text: 'A flow tens of metres thick shrinks as it cools and compacts under its own weight. The rate drops over the years: tens of centimetres per year in 2022, below the noise of 4 months of data in 2026.' },
      { title: 'A perfect mirror for radar', text: 'New, bare, rigid rock returns almost the same signal at every pass (coherence 0.86). The farmland and vegetation around it change more (0.6).' },
      { title: 'Teide, to be watched', text: 'In June 2026 the Spanish geological institute recorded over 200 quakes in a day under Las Cañadas and found no significant deformation. The same technique applied to Tenerife would raise the alarm if the volcano started to swell.' },
      { title: 'A single geometry', text: 'We use ascending track 131. Descending track 81 has coherence but no unwrapped phase over the flow, so it cannot be used as a cross-check.' },
    ],
    who: [
      { title: 'Island council and rebuilding', text: 'Knowing when a lava flow stops moving helps decide where and when to build again.' },
      { title: 'Volcano observatories', text: 'Deformation monitoring of the islands every 12 days, day and night.' },
      { title: 'Civil protection', text: 'A stable baseline makes any future change easier to spot.' },
    ],
  },
  granada: {
    ...CONTENT_ES.granada,
    place: 'Santa Fe · Alhendín (Granada, Spain)',
    dateLabel: '14–18 Aug 2026',
    headline: 'Granada: an earthquake that left no measurable trace',
    summary:
      'On 14 August a magnitude 5.2 earthquake (EMSC), only 2 km deep, shook the plain of Granada; a magnitude 4.9 followed on the 18th. Three NISAR interferograms from three different tracks span both. None shows deformation above the atmospheric noise (±0.8 cm): next to the epicentre the two descending tracks, which look from almost the same angle, give +1.3 and −0.2 cm. The ground moved less than a centimetre over kilometre scales.',
    why: [
      { title: 'One fringe is 11.9 cm', text: 'Each colour cycle of an L-band interferogram is half a wavelength: 11.9 cm towards or away from the satellite. A magnitude 5 earthquake usually moves the ground a few millimetres. Here the fringes are drawn every 2 cm so that anything shows at all.' },
      { title: 'Two identical views, two different answers', text: 'Tracks 95 and 167 are both descending and look from almost the same angle. If the ground had moved, they would agree. They disagree: that is the atmosphere, not the earthquake.' },
      { title: 'What is not seen also sets a limit', text: 'NISAR seeing nothing means there was no surface deformation larger than ~1 cm over kilometre-wide areas. That is useful to understand the rupture.' },
      { title: 'How to measure it better', text: 'Sentinel-1 (C-band, 2.8 cm per fringe), GNSS stations and more NISAR pairs to average out the atmosphere.' },
    ],
    who: [
      { title: 'Seismologists', text: 'Bounding how much the surface moved helps model the fault.' },
      { title: 'Civil protection', text: 'Rule out large deformation of dams, slopes or roads within days.' },
      { title: 'Engineering', text: 'Coherence also reveals damage: collapsed buildings stop returning the same signal.' },
    ],
  },
  alora: {
    ...CONTENT_ES.alora,
    place: 'Álora (Málaga) · Córdoba–Málaga high-speed line',
    dateLabel: '4 Feb 2026',
    headline: 'Álora: the slope that failed before NISAR arrived',
    summary:
      'On 4 February, during storm Leonardo, a cutting on the Córdoba–Málaga high-speed line collapsed between Gobantes and Álora. Direct trains to Madrid only returned on 30 April, and the second track in July. NISAR had no images of the area until 20 June; Sentinel-1 did pass the day before (3 Feb) and five days after (9 Feb). Since June, 9 NISAR interferograms watch the line: relative to its surroundings it moves less than 1 mm. The repaired section is stable.',
    why: [
      { title: 'NISAR arrived late', text: 'Over Spain, public NISAR data are dense only from June 2026. The slope failed in February: as with the storm in Valencia, the satellite was not there when it was needed.' },
      { title: 'A small landslide', text: 'A cutting about 5 m high covers only a few 20–30 m pixels. The news does not give the exact spot, so we do not mark one: we show the Sentinel-1 change around the line (C-band).' },
      { title: 'Stable = coherent', text: 'Coherence next to the line stays at 0.77 all summer. A moving slope or active earthworks would lose it.' },
      { title: 'Watch before it breaks', text: 'Many slopes creep slowly before they fail. Long InSAR series can rank the creeping cuttings before the rainy season.' },
    ],
    who: [
      { title: 'Rail infrastructure manager', text: 'Watch repaired slopes millimetre by millimetre and prioritise the ones that move.' },
      { title: 'Geological survey', text: 'A national landslide inventory updated from space.' },
      { title: 'Travellers and the economy', text: 'Three months without direct Málaga–Madrid trains: prevention is cheaper.' },
    ],
  },
}

const STORY_EN = [
  { title: 'Gelida, 20 January 2026', text: 'After days of heavy rain, a retaining wall gives way under water pressure and falls onto the Rodalies commuter line near Barcelona. A trainee driver dies and the Catalan rail network grinds to a halt. Water, fire, terrain and infrastructure: risks that can be watched from space.', target: null as string | null },
  { title: 'Summer: fire', text: '2026 is Spain’s second-worst wildfire year of the century. In Niebla (Huelva) NISAR measures about 32,000 ha burned through the smoke, with 89% agreement with the official European perimeter.', target: 'niebla' },
  { title: 'Autumn: the water nobody saw', text: 'Storm “Adam” dumps hundreds of litres on La Safor on the night of 18–19 October. No radar passed during the storm: by the time they came back, the water was gone.', target: 'dana' },
  { title: 'All year round: ground on the move', text: 'With interferometry NISAR measures centimetres. In Lorca the valley sinks about 16 cm a year from aquifer pumping. In Granada, La Palma and Álora radar bounds what did not move: a magnitude 5.2 earthquake that deformed the ground less than 1 cm, a lava flow that has almost stopped settling and a high-speed rail slope that is stable after repair.', target: 'lorca' },
  { title: 'What NISAR can do', text: 'NISAR sees day and night, through clouds and smoke, and tells fire from harvest thanks to its polarizations. Combined with other radars and tasked in time, it can become a warning system for decision-makers.', target: null },
]

export const CONTENT = new Proxy({} as Record<string, CaseContent>, {
  get: (_, id: string) => (lang === 'en' ? CONTENT_EN : CONTENT_ES)[id],
})
export const getStory = () => (lang === 'en' ? STORY_EN : STORY_ES)
