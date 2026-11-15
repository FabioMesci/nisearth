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
  },
  rasuwa: {
    short: 'Rasuwa · Langtang',
    region: 'Nepal',
    order: 3,
    place: 'Valle de Langtang · Rasuwa (Nepal)',
    dateLabel: '26 ago 2026',
    headline: 'Rasuwa: el derrumbe glaciar y la riada que vio el radar bajo el monzón',
    summary:
      'El 26 de agosto de 2026, en pleno monzón del Himalaya, una avalancha de roca y hielo en la cabecera de Langtang desencadenó una avenida torrencial (GLOF) que arrasó el cauce del Lende Khola y el Trishuli (activación Copernicus EMSR927). Mientras las nubes taparon los satélites ópticos durante cinco semanas, la banda L de NISAR (pasada 98 ascendente, 19 ago → 31 ago) cartografió las 633 ha de lengua de derrubios y garganta arrasada sin un solo hueco, con una caída media de −3,4 dB en HV allí donde la avenida arrancó el bosque de ribera.',
    passes: {
      from: '2026-08-15',
      to: '2026-09-06',
      event: ['2026-08-26T00:00', '2026-08-26T18:00'],
      list: [
        { date: '2026-08-16T12:21', sensor: 'S1D' },
        { date: '2026-08-16T12:58', sensor: 'NISAR' },
        { date: '2026-08-19T23:39', sensor: 'NISAR' },
        { date: '2026-08-23T13:06', sensor: 'NISAR' },
        { date: '2026-08-24T00:18', sensor: 'S1D' },
        { date: '2026-08-28T12:21', sensor: 'S1D' },
        { date: '2026-08-28T12:58', sensor: 'NISAR' },
        { date: '2026-08-31T23:39', sensor: 'NISAR' },
        { date: '2026-09-04T13:06', sensor: 'NISAR' },
        { date: '2026-09-05T00:18', sensor: 'S1D' },
      ],
    },
    notes: [{ date: '2026-08-26', label: 'Derrumbe / GLOF' }],
    why: [
      {
        title: 'Atravesar cinco semanas de monzón',
        text: 'Entre el 24 de agosto y el 28 de septiembre todas las pasadas ópticas de Sentinel-2 tuvieron entre un 49 % y un 97 % de nubes; la primera imagen despejada llegó el 1 de octubre. NISAR midió el alcance completo cinco días después del colapso.',
      },
      {
        title: 'Lengua glaciar y garganta arrasada',
        text: 'La caída de HV (−3,4 dB de media) traza tanto el lóbulo de desprendimiento en la morrena glaciar oriental (211 ha de roca y hielo) como los 254 ha de bosque subalpino y de ribera arrancados a lo largo del cañón hacia Syaphrubesi.',
      },
      {
        title: 'Geometría en cañones de 5.000 m',
        text: 'En gargantas profundas del Himalaya la geometría de visión es crítica: la pasada 98 ascendente (modo 40 MHz DHDH) cubre el 100 % del valle sin huecos, mientras que la pasada 48 descendente del 28 de agosto dejó una franja ciega entre sub-haces sobre la cabecera.',
      },
      {
        title: '323 mm de lluvia continua',
        text: 'El reanálisis ERA5 registra lluvia todos los días del 15 de agosto al 5 de septiembre (125,5 mm solo entre las dos pasadas de NISAR), saturando las laderas y morrenas antes de la rotura.',
      },
    ],
    who: [
      { title: 'Protección civil (NDRRMA)', text: 'Identificar en horas qué tramos de la carretera Pasang Lhamu (0,6 km afectados directamente) y aldeas como Syaphrubesi quedan aislados bajo las nubes.' },
      { title: 'Vigilancia glaciar (ICIMOD)', text: 'Detectar vaciados bruscos de lagos glaciares (GLOF) y avalanchas de roca-hielo sin esperar al fin del monzón.' },
      { title: 'Hidroeléctricas y cuencas', text: 'Evaluar la avenida de lodo y bloques en el corredor del Trishuli, donde viven unas 2.880 personas a menos de 1 km del cauce.' },
    ],
  },  lorca: {
    short: 'Lorca',
    region: 'Murcia',
    order: 3,
    place: 'Alto Guadalentín · Lorca (Murcia)',
    dateLabel: 'jun–oct 2026',
    headline: 'Lorca: meses de cambio, días de lluvia',
    summary: '¿Cómo cambia un mismo territorio durante meses mientras experimenta episodios breves de lluvia? Comparamos una serie preliminar de desplazamiento en línea de visión con precipitación diaria estimada para el Alto Guadalentín.',
    why: [
      { title: 'Qué mide el radar', text: 'La interferometría mide cambios en la línea de visión del satélite, no directamente el movimiento vertical. Los resultados mostrados son preliminares y necesitan una auditoría de los productos originales.' },
      { title: 'Dos escalas distintas', text: 'Las pasadas delimitan intervalos de 12 o 24 días; la precipitación es una estimación diaria de una celda de reanálisis, no una observación puntual.' },
      { title: 'Coincidencia no es causa', text: 'El bombeo, las variaciones del acuífero, los retardos y otros factores pueden influir. La serie no permite atribuir una causa al desplazamiento.' },
    ],
    who: [{ title: 'Investigación y gestión del agua', text: 'Comparar señales ayuda a plantear preguntas para contrastar con piezómetros y observaciones independientes.' }],
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
  venezuela: {
    short: 'Yaracuy · La Guaira',
    region: 'Venezuela',
    order: 6,
    place: 'San Felipe (Yaracuy) · Catia La Mar (La Guaira)',
    dateLabel: '24 jun 2026',
    headline: 'Venezuela: el doblete Mw 7,2 y 7,5 que desgarró 200 km de costa en 39 segundos',
    summary:
      'El 24 de junio de 2026 un doblete sísmico superficial (10,0 km de profundidad, USGS) rompió el límite entre las placas del Caribe y Sudamérica: el precursor de Mw 7,2 se registró a las 18:04:31 HLV (22:04:31 UTC) 20 km al este de San Felipe, Yaracuy (10,371° N, 68,556° O), y 39 segundos después, a las 18:05:03 HLV (22:05:03 UTC), el sismo principal de Mw 7,5 golpeó 17 km al oeste de Catia La Mar, La Guaira (10,622° N, 67,194° O). Apenas 12 horas más tarde (25 jun, 10:06 UTC), la pasada 162 ascendente de NISAR capturó toda la ruptura: junto a las pasadas 54, 61 y 126, cuatro interferogramas L2 GUNW revelan desplazamientos en línea de visión de hasta −37,9 cm y +32,7 cm y más de 102.000 ha deformadas a lo largo del sistema de fallas Boconó–Morón–San Sebastián.',
    passes: {
      from: '2026-06-12',
      to: '2026-07-05',
      event: ['2026-06-24T22:04', '2026-06-24T23:00'],
      list: [
        { date: '2026-06-13T10:06', sensor: 'NISAR' },
        { date: '2026-06-17T23:02', sensor: 'NISAR' },
        { date: '2026-06-18T09:58', sensor: 'NISAR' },
        { date: '2026-06-22T22:54', sensor: 'NISAR' },
        { date: '2026-06-25T10:06', sensor: 'NISAR' },
        { date: '2026-06-29T23:02', sensor: 'NISAR' },
        { date: '2026-06-30T09:58', sensor: 'NISAR' },
        { date: '2026-07-04T22:54', sensor: 'NISAR' },
      ],
    },
    notes: [{ date: '2026-06-24', label: 'Mw 7,2 + 7,5' }],
    why: [
      {
        title: 'Signos opuestos = desgarre horizontal dextral',
        text: 'En una órbita ascendente el radar mira hacia el este; en una descendente, hacia el oeste. En la costa del Mw 7,5 (Chichiriviche–Catia La Mar), las pasadas ascendentes 162 y 61 miden −32,3 y −37,9 cm (el suelo se aleja), mientras la descendente 126 mide +32,7 cm (se acerca). Esa inversión demuestra un movimiento horizontal dextral (rumbo lateral derecho) a lo largo de la falla de San Sebastián.',
      },
      {
        title: 'La traza de la falla de Morón, al descubierto',
        text: 'En el extremo occidental (Mw 7,2, San Felipe–Morón), el interferograma corta de este a oeste la costa del Golfo Triste: el bloque norte avanza hacia el oeste (+30,5 cm en la pasada 162 ascendente; −23,7 cm en la 54 descendente) frente al bloque sur, sumando un salto relativo de más de medio metro a través de la falla.',
      },
      {
        title: 'Banda L frente a la selva nublada costera',
        text: 'La Cordillera de la Costa (Henri Pittier, Sierra de Aroa y El Ávila, hasta 2.765 m) está cubierta de selva tropical densa donde la banda C pierde coherencia en días. La longitud de onda de 23,8 cm de NISAR penetra el dosel y permite contar franjas completas de 11,9 cm sin saltos de fase.',
      },
      {
        title: '12 horas de respuesta y corrección ionosférica',
        text: 'La pasada 162 ascendente sobrevoló Venezuela a las 10:06 UTC del 25 de junio, solo 12 horas después del doblete. A 10° N de latitud ecuatorial y en una escena de 235 km, aplicar la pantalla ionosférica de espectro dividido (split-spectrum) del producto GUNW resulta clave para aislar la deformación tectónica.',
      },
    ],
    who: [
      { title: 'FUNVISIS y USGS', text: 'Invertir el deslizamiento coseísmico en las fallas de Morón y San Sebastián combinando las cuatro geometrías ascendentes y descendentes.' },
      { title: 'Protección Civil y puertos', text: 'Identificar los tramos costeros con mayor sacudida, subsidencia y licuefacción en Puerto Cabello, Morón, Catia La Mar y La Guaira.' },
      { title: 'Infraestructuras críticas', text: 'Inspeccionar autopistas (Caracas–La Guaira, Valencia–Puerto Cabello), refinerías costeras y taludes en la Cordillera de la Costa.' },
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
    text: 'Con interferometría NISAR mide centímetros. En Lorca una serie preliminar muestra movimiento en la línea de visión del satélite; sus causas requieren estudio. En Granada, La Palma y Álora el radar acota lo que no se movió: un terremoto de magnitud 5,2 que no deformó el suelo más de 1 cm, una colada que ya casi no se asienta y un talud de AVE estable tras su reparación.',
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
  },
  rasuwa: {
    ...CONTENT_ES.rasuwa,
    place: 'Langtang Valley · Rasuwa (Nepal)',
    dateLabel: '26 Aug 2026',
    headline: 'Rasuwa: the glacial landslide and outburst flood radar saw through the monsoon',
    summary:
      'On 26 August 2026, at the height of the Himalayan monsoon, a rock and ice avalanche in the upper Langtang valley triggered a glacial lake outburst flood (GLOF) and debris flow down the Lende Khola and Trishuli gorge (Copernicus EMSR927 activation). While monsoon clouds blinded optical satellites for five weeks, NISAR’s L-band (ascending track 98, 19 Aug → 31 Aug) mapped all 633 ha of the detachment tongue and scoured canyon with zero gaps, recording a −3.4 dB mean HV drop where the surge stripped the riparian forest.',
    notes: [{ date: '2026-08-26', label: 'Landslide / GLOF' }],
    why: [
      {
        title: 'Seeing through five weeks of monsoon',
        text: 'Between 24 August and 28 September every Sentinel-2 optical pass had 49% to 97% cloud cover; the first clear view arrived on 1 October. NISAR mapped the full extent five days after the collapse.',
      },
      {
        title: 'Glacier detachment and scoured gorge',
        text: 'The HV drop (−3.4 dB on average) traces both the detachment lobe on the eastern glacial moraine (211 ha of bare rock and ice) and the 254 ha of subalpine and riparian forest stripped along the canyon down towards Syaphrubesi.',
      },
      {
        title: 'Geometry in 5,000 m canyons',
        text: 'In deep Himalayan gorges viewing geometry is critical: ascending track 98 (40 MHz DHDH mode) covers 100% of the valley seamlessly, whereas descending track 48 on 28 August left a ScanSAR sub-swath gap across the headwall.',
      },
      {
        title: '323 mm of continuous rain',
        text: 'ERA5 reanalysis records rain every single day from 15 August to 5 September (125.5 mm between the two NISAR passes alone), saturating slopes and moraines prior to failure.',
      },
    ],
    who: [
      { title: 'Disaster response (NDRRMA)', text: 'Pinpoint within hours which sections of the Pasang Lhamu Highway (0.6 km directly hit) and settlements such as Syaphrubesi are cut off under monsoon cloud.' },
      { title: 'Glacial lake monitoring (ICIMOD)', text: 'Detect sudden glacial lake outburst floods (GLOFs) and rock-ice avalanches without waiting for the monsoon to end.' },
      { title: 'Hydropower and river basins', text: 'Assess boulder and sediment surges along the Trishuli corridor, where about 2,880 people live within 1 km of the channel.' },
    ],
  },  lorca: {
    ...CONTENT_ES.lorca,
    place: 'Alto Guadalentín · Lorca (Murcia, Spain)',
    dateLabel: 'Jun–Oct 2026',
    headline: 'Lorca: months of change, days of rain',
    summary: 'How does one place change over months while experiencing short spells of rain? Compare a preliminary line-of-sight displacement series with estimated daily precipitation in Alto Guadalentín.',
    why: [
      { title: 'What radar measures', text: 'Interferometry measures change along the satellite line of sight, not vertical motion directly. These preliminary results require an audit of the original products.' },
      { title: 'Two different timescales', text: 'Satellite passes define intervals of 12 or 24 days; precipitation is a daily reanalysis grid estimate, not a point observation.' },
      { title: 'Timing is not causation', text: 'Pumping, aquifer variations, delays and other factors may contribute. This series cannot establish the cause of displacement.' },
    ],
    who: [{ title: 'Research and water management', text: 'Comparing signals helps frame questions to test against groundwater gauges and independent observations.' }],
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
  venezuela: {
    ...CONTENT_ES.venezuela,
    place: 'San Felipe (Yaracuy) · Catia La Mar (La Guaira, Venezuela)',
    dateLabel: '24 Jun 2026',
    headline: 'Venezuela: the Mw 7.2 & 7.5 earthquake doublet that tore 200 km of coast in 39 seconds',
    summary:
      'On 24 June 2026 a shallow earthquake doublet (10.0 km depth, USGS) ruptured the Caribbean–South American plate boundary: an Mw 7.2 foreshock struck at 18:04:31 local time (22:04:31 UTC) 20 km east of San Felipe, Yaracuy (10.371° N, 68.556° W), followed 39 seconds later at 18:05:03 local time (22:05:03 UTC) by an Mw 7.5 mainshock 17 km west of Catia La Mar, La Guaira (10.622° N, 67.194° W). Just 12 hours later (25 Jun, 10:06 UTC), NISAR ascending track 162 captured the entire rupture corridor: together with tracks 54, 61 and 126, four L2 GUNW interferograms reveal line-of-sight displacements of up to −37.9 cm and +32.7 cm and over 102,000 ha of coherent ground deformation along the Boconó–Morón–San Sebastián fault system.',
    notes: [{ date: '2026-06-24', label: 'Mw 7.2 + 7.5' }],
    why: [
      {
        title: 'Opposite signs = right-lateral strike-slip',
        text: 'In an ascending orbit the radar looks east; in a descending orbit it looks west. Along the Mw 7.5 coast (Chichiriviche–Catia La Mar), ascending tracks 162 and 61 measure −32.3 and −37.9 cm (moving away from the satellite), while descending track 126 measures +32.7 cm (moving towards it). That sign reversal proves horizontal right-lateral (dextral) strike-slip motion along the San Sebastián fault.',
      },
      {
        title: 'The Morón surface fault trace exposed',
        text: 'In the western rupture zone (Mw 7.2, San Felipe–Morón), the interferogram slices east–west across the Golfo Triste coast: the northern block shifts westwards (+30.5 cm on ascending track 162; −23.7 cm on descending track 54) relative to the southern block, totalling over half a metre of relative offset across the fault.',
      },
      {
        title: 'L-band through tropical cloud forest',
        text: 'The Cordillera de la Costa (Henri Pittier, Sierra de Aroa and El Ávila, up to 2,765 m) is blanketed in dense tropical cloud forest where C-band loses coherence within days. NISAR’s 23.8 cm wavelength penetrates the canopy and unwraps full 11.9 cm fringes without phase jumps.',
      },
      {
        title: '12-hour response and ionospheric screen',
        text: 'Ascending track 162 flew over Venezuela at 10:06 UTC on 25 June, only 12 hours after the doublet. At 10° N equatorial latitude across a 235 km scene, applying the split-spectrum ionospheric phase screen from the GUNW product is essential to isolate the tectonic signal.',
      },
    ],
    who: [
      { title: 'FUNVISIS & USGS', text: 'Invert coseismic slip on the Morón and San Sebastián faults by combining all four ascending and descending viewing geometries.' },
      { title: 'Civil protection & ports', text: 'Pinpoint coastal sectors with the strongest shaking, subsidence and liquefaction around Puerto Cabello, Morón, Catia La Mar and La Guaira.' },
      { title: 'Critical infrastructure', text: 'Prioritise inspections of the Caracas–La Guaira and Valencia–Puerto Cabello highways, coastal refineries and steep mountain slopes.' },
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
  { title: 'All year round: ground on the move', text: 'With interferometry NISAR measures centimetres. In Lorca a preliminary series shows motion along the satellite line of sight; its causes need study. In Granada, La Palma and Álora radar bounds what did not move: a magnitude 5.2 earthquake that deformed the ground less than 1 cm, a lava flow that has almost stopped settling and a high-speed rail slope that is stable after repair.', target: 'lorca' },
  { title: 'What NISAR can do', text: 'NISAR sees day and night, through clouds and smoke, and tells fire from harvest thanks to its polarizations. Combined with other radars and tasked in time, it can become a warning system for decision-makers.', target: null },
]

export const CONTENT = new Proxy({} as Record<string, CaseContent>, {
  get: (_, id: string) => (lang === 'en' ? CONTENT_EN : CONTENT_ES)[id],
})
export const getStory = () => (lang === 'en' ? STORY_EN : STORY_ES)
