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
  /** Sustituye al tipo de peligro en la lista y el globo (p. ej. «Antes del colapso») */
  kindLabel?: string
  dateLabel: string
  headline: string
  summary: string
  why: { title: string; text: string }[]
  who: { title: string; text: string }[]
  /** Marcas en el gráfico de la serie temporal */
  notes?: { date: string; label: string }[]
  /** Pasadas de radar alrededor del evento (para la línea de revisita) */
  passes?: { from: string; to: string; event: [string, string]; list: Pass[] }
  /** NISAR en el mundo: qué afirma NASA/JPL (traducido); si falta, se usa el del manifest */
  officialClaim?: string
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
    short: 'Rasuwa',
    region: 'Nepal',
    kindLabel: 'Colapso y riada',
    order: 11,
    place: 'Langtang Lirung · río Lhende · Rasuwa (Nepal)',
    dateLabel: '26 ago 2026',
    headline: 'Rasuwa: la montaña que se vino abajo, vista a través del monzón',
    summary:
      'El 26 de agosto de 2026, a las 8:37 hora local y en pleno monzón, se desplomó la cara norte del Langtang Lirung: una avalancha de roca y hielo a unos 5300 m que se convirtió en un flujo de derrubios, represó el río Lhende en la frontera con el Tíbet y, al vaciarse, bajó 72 km por el Bhote Koshi–Trishuli. Más de 1400 muertos y miles de desaparecidos; viviendas, puentes, carreteras y 12 centrales hidroeléctricas dañadas (activación Copernicus EMSR927). Mientras las nubes tapaban a los satélites ópticos durante cinco semanas, NISAR (pasada 98 ascendente, 19 → 31 ago) cartografió 633 ha de lengua de derrubios y garganta arrasada, con una caída media de −3,4 dB en HV allí donde la avenida arrancó el bosque. La ladera que se movía antes de romperse está en el caso «Langtang Lirung».',
    passes: {
      from: '2026-08-15',
      to: '2026-09-06',
      event: ['2026-08-26T02:52', '2026-08-26T18:00'],
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
    notes: [{ date: '2026-08-26', label: 'Colapso y riada' }],
    why: [
      {
        title: 'Atravesar cinco semanas de monzón',
        text: 'Entre el 24 de agosto y el 28 de septiembre todas las pasadas ópticas de Sentinel-2 tuvieron entre un 49 % y un 97 % de nubes; la primera imagen despejada llegó el 1 de octubre. NISAR midió el alcance completo cinco días después del colapso.',
      },
      {
        title: 'Lengua de derrubios y garganta arrasada',
        text: 'La caída de HV (−3,4 dB de media) traza tanto el lóbulo del desprendimiento al pie de la cara norte (211 ha de roca y hielo) como las 254 ha de bosque subalpino y de ribera arrancadas a lo largo del cañón hacia Syaphrubesi.',
      },
      {
        title: 'No fue un lago glaciar',
        text: 'Copernicus EMS activó la cartografía como un desbordamiento de lago glaciar (GLOF) y así se contó al principio. Los análisis posteriores (sismogramas del USGS, imágenes ópticas) apuntan a un colapso de roca y hielo que represó temporalmente el Lhende, cuyo vaciado alimentó la riada.',
      },
      {
        title: 'Geometría en cañones de 5.000 m',
        text: 'En gargantas profundas del Himalaya la geometría de visión es crítica: la pasada 98 ascendente (modo 40 MHz DHDH) cubre el 100 % del valle sin huecos, mientras que la pasada 48 descendente del 28 de agosto dejó una franja ciega entre sub-haces sobre la cabecera.',
      },
      {
        title: 'Lluvia continua antes de la rotura',
        text: 'El reanálisis ERA5 registra lluvia todos los días del 15 de agosto al 5 de septiembre (323 mm en total, 125,5 mm solo entre las dos pasadas de NISAR), saturando laderas y morrenas.',
      },
      {
        title: 'Sin comparación oficial',
        text: 'NASA no ha publicado imagen NISAR de este evento: el resultado es solo nuestro. Lo marcado es una caída fuerte de la señal, no daño confirmado; habría que validarlo con las capas de EMSR927 o con imágenes ópticas.',
      },
    ],
    who: [
      { title: 'Protección civil (NDRRMA)', text: 'Identificar en horas qué tramos de la carretera Pasang Lhamu (0,6 km afectados directamente) y aldeas como Syaphrubesi quedan aislados bajo las nubes.' },
      { title: 'Vigilancia glaciar (ICIMOD)', text: 'Detectar avalanchas de roca y hielo y vaciados de lagos glaciares sin esperar al fin del monzón.' },
      { title: 'Hidroeléctricas y cuencas', text: 'Evaluar la avenida de lodo y bloques en el corredor del Trishuli, donde viven unas 2.880 personas a menos de 1 km del cauce.' },
      { title: 'Cooperación transfronteriza', text: 'El río cruza la frontera dos veces: compartir vigilancia radar de la cabecera entre Nepal y China.' },
    ],
  },
  lorca: {
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
  // ---- NISAR en el mundo: eventos difundidos por NASA/JPL, procesados con nuestro pipeline ----
  venezuela: {
    short: 'Yaracuy · La Guaira',
    region: 'Venezuela',
    order: 7,
    place: 'San Felipe (Yaracuy) · Catia La Mar (La Guaira)',
    dateLabel: '24 jun 2026',
    headline: 'Venezuela: el doblete Mw 7,2 y 7,5 que rompió la costa en 32 segundos',
    summary:
      'El 24 de junio de 2026 un doblete sísmico superficial (10 km de profundidad, USGS) rompió el límite entre las placas del Caribe y Sudamérica: el Mw 7,2 se registró a las 18:04:31 HLV (22:04:31 UTC) 20 km al este de San Felipe, Yaracuy (10,371° N, 68,556° O), y 32 segundos después, a las 18:05:03 HLV (22:05:03 UTC), el sismo principal de Mw 7,5 golpeó 17 km al oeste de Catia La Mar, La Guaira (10,622° N, 67,194° O). Apenas 12 horas más tarde, la pasada 162 ascendente de NISAR cubrió los dos epicentros; con las pasadas 54, 61 y 126, cuatro interferogramas muestran desplazamientos en la línea de visión de hasta −37,9 y +32,7 cm y más de 102.000 ha que se mueven por encima del ruido. NASA publicó su propio mapa (hasta ~60 cm hacia el oeste junto al aeropuerto de Maiquetía): visto con la mirada inclinada del radar, ese movimiento horizontal equivale a unos 33–42 cm, justo lo que mide nuestro procesado independiente.',
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
    officialClaim: 'Hasta ~60 cm de desplazamiento, sobre todo horizontal y hacia el oeste, junto al aeropuerto internacional al norte de Caracas.',
    why: [
      {
        title: 'Signos opuestos = desgarre horizontal dextral',
        text: 'En una órbita ascendente el radar mira hacia el este; en una descendente, hacia el oeste. En la costa del Mw 7,5 (Chichiriviche–Catia La Mar), las pasadas ascendentes 162 y 61 miden −32,3 y −37,9 cm (el suelo se aleja), mientras la descendente 126 mide +32,7 cm (se acerca). Esa inversión indica un movimiento horizontal dextral (lateral derecho) a lo largo de la falla de San Sebastián.',
      },
      {
        title: 'Cómo cuadra con el mapa de NASA',
        text: 'El radar solo ve la parte del movimiento que va en su línea de visión, inclinada entre 33° y 47°. Un desplazamiento horizontal de ~60 cm hacia el oeste, como el de JPL, se proyecta en unos 33–42 cm: el mismo orden que nuestras cuatro pasadas, procesadas sin usar su mapa.',
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
        text: 'La pasada 162 ascendente sobrevoló Venezuela a las 10:06 UTC del 25 de junio, solo 12 horas después del doblete. A 10° N y en una escena de 235 km, aplicar la pantalla ionosférica de espectro dividido (split-spectrum) del producto GUNW ayuda a aislar la deformación tectónica.',
      },
      {
        title: 'Sin datos en el mar',
        text: 'El agua cambia en cada instante y el radar no puede comparar dos pasadas sobre ella. El epicentro del Mw 7,5 está en el mar: el movimiento se mide en tierra, en la franja costera entre Catia La Mar y La Guaira.',
      },
    ],
    who: [
      { title: 'FUNVISIS y USGS', text: 'Invertir el deslizamiento cosísmico en las fallas de Morón y San Sebastián combinando las cuatro geometrías ascendentes y descendentes.' },
      { title: 'Protección Civil y puertos', text: 'Identificar los tramos costeros con mayor sacudida, subsidencia y licuefacción en Puerto Cabello, Morón, Catia La Mar y La Guaira.' },
      { title: 'Infraestructuras críticas', text: 'Inspeccionar el aeropuerto de Maiquetía, las autopistas Caracas–La Guaira y Valencia–Puerto Cabello, las refinerías costeras y los taludes de la Cordillera de la Costa.' },
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
  krasheninnikov: {
    short: 'Krasheninnikov',
    region: 'Kamchatka',
    order: 8,
    place: 'Volcán Krasheninnikov · Kamchatka (Rusia)',
    dateLabel: 'jun–oct 2026',
    headline: 'Krasheninnikov: el volcán que despertó tras siglos',
    summary:
      'Cuatro días después del terremoto M8,8 de Kamchatka (30 jul 2025), Krasheninnikov entró en erupción por primera vez en unos 500 años. Los datos NISAR públicos del volcán empiezan en junio de 2026: con 11 imágenes de la pasada 80 aparecen lóbulos nuevos y brillantes en el frente noreste de la colada. Sobre las zonas que se aclaran, la señal HH sube de −14 dB en junio a −4,5 dB el 18 de agosto y luego se estabiliza, como si la colada hubiera dejado de avanzar a mitad de verano.',
    notes: [{ date: '2026-08-18', label: 'Se estabiliza' }],
    officialClaim: 'Timelapse de 17 imágenes NISAR (25 dic 2025 – 17 ago 2026): la lava llena una caldera interior, desborda al cráter mayor y se abre en abanico hacia el este.',
    why: [
      {
        title: 'La lava brilla en radar',
        text: 'La roca nueva es rugosa a la escala de la onda (24 cm) y devuelve mucha señal en HH y en HV a la vez. La nieve húmeda y el suelo liso devuelven poca.',
      },
      {
        title: 'El verano engaña',
        text: 'De junio a agosto la nieve se funde y las laderas se secan: casi todo el volcán se aclara. Por eso comparamos el 13 jul con el 23 sep, ya sin nieve, y solo a menos de 7 km del cráter. Aun así, parte de lo marcado al suroeste son neveros que desaparecen, no lava.',
      },
      {
        title: 'Lo que no vemos',
        text: 'NASA tiene imágenes desde el 25 dic 2025, pero las públicas en ASF empiezan el 19 jun 2026. El inicio de la erupción (agosto de 2025) es anterior a NISAR.',
      },
      {
        title: 'Remoto, pero importa',
        text: 'Kamchatka casi no tiene población, pero la ceniza de sus volcanes cruza rutas aéreas del Pacífico Norte. Un radar que ve a través de las nubes y de noche sigue la erupción sin depender del tiempo.',
      },
    ],
    who: [
      { title: 'Observatorios volcánicos', text: 'Seguir la colada cada 12 días aunque haya nubes o noche polar.' },
      { title: 'Aviación', text: 'Saber si la erupción sigue activa ayuda a decidir alertas de ceniza en las rutas del Pacífico Norte.' },
      { title: 'Ciencia', text: 'Un volcán despertado por un M8,8: un caso raro para entender cómo los terremotos disparan erupciones.' },
    ],
  },
  mozambique: {
    short: 'Limpopo',
    region: 'Mozambique',
    order: 9,
    place: 'Chókwè · bajo Limpopo (Mozambique)',
    dateLabel: '5–17 ene 2026',
    headline: 'Limpopo: el río que se salió de su valle',
    summary:
      'Las lluvias de diciembre y enero desbordaron el Limpopo y el Incomati en el sur de Mozambique: según NASA, más de 600 000 desplazados y 30 000 viviendas inundadas. Entre el 5 y el 17 de enero, NISAR ve aparecer 325 km² de agua nueva, sobre todo en la llanura del Limpopo y en el regadío de Chókwè, a través de las nubes que tapaban a los satélites ópticos. Otros 472 km² ya eran agua en las dos fechas: ríos, lagunas y zonas que ya estaban inundadas el 5 de enero.',
    notes: [{ date: '2026-01-17', label: 'Crecida' }],
    officialClaim: 'Comparación antes/después (5 y 17 ene) de las cuencas del Limpopo y el Incomati: el radar ve el agua bajo las nubes que bloqueaban a Sentinel-2. Más de 600 000 desplazados.',
    why: [
      {
        title: 'El agua es un espejo',
        text: 'Igual que en la DANA, una lámina de agua refleja el pulso lejos del satélite: la llanura inundada pasa de −11 a −17 dB en HH. Aquí el agua se queda semanas en una llanura casi plana, y la pasada del 17 de enero la pilla de lleno.',
      },
      {
        title: 'Todo lo demás se aclara',
        text: 'El suelo empapado devuelve más señal: casi toda la escena se aclara entre el 5 y el 17 de enero. Por eso pedimos las dos cosas a la vez: una caída de al menos 3 dB y quedar por debajo de −14 dB, el valle entre el agua (−18 dB) y la tierra mojada (−6 dB).',
      },
      {
        title: 'Lo que el radar no ve',
        text: 'Bajo árboles o entre cultivos altos, el agua no oscurece: rebota en los troncos y brilla (doble rebote). Ese bosque inundado no entra en nuestra máscara, así que el área real es mayor.',
      },
      {
        title: 'Misma técnica que en España',
        text: 'Es el mismo pipeline que en La Safor. La diferencia es el tiempo: en la DANA el agua drenó en horas y no hubo radar a tiempo; en el Limpopo dura semanas y NISAR la ve.',
      },
    ],
    who: [
      { title: 'Protección civil (INGD)', text: 'Dónde está el agua aunque haya nubes, para evacuar y llevar ayuda.' },
      { title: 'Agricultura', text: 'Qué parcelas del regadío de Chókwè quedaron bajo el agua, para estimar pérdidas de cosecha.' },
      { title: 'Gestión de cuencas', text: 'Calibrar los modelos de crecida del Limpopo, que cruza cuatro países.' },
    ],
  },
  cdmx: {
    short: 'Ciudad de México',
    region: 'México',
    order: 10,
    place: 'Valle de México · Chalco (México)',
    dateLabel: 'oct 2025 – feb 2026',
    headline: 'Ciudad de México: una ciudad que se hunde a la vista',
    summary:
      'Ciudad de México está construida sobre el lecho de un antiguo lago y bombea el agua de su acuífero: el suelo arcilloso se compacta y la ciudad se hunde. Con 10 interferogramas NISAR encadenados (25 oct → 22 feb), unas 37 500 ha del antiguo lago bajan más que el ruido (±1 cm). En Chalco, al sureste, el hundimiento llega a 22 cm en 120 días. Es el mismo fenómeno que en Lorca, pero varias veces más rápido.',
    officialClaim: 'Mapa NISAR del 25 oct 2025 al 17 ene 2026: las zonas en azul oscuro se hunden más de 2 cm al mes, sobre todo por el bombeo de agua subterránea.',
    why: [
      {
        title: 'Un lago que se vacía por debajo',
        text: 'Las arcillas del antiguo lago de Texcoco tienen mucha agua. Al bombear el acuífero, pierden presión y se compactan: el suelo baja, y no vuelve a subir.',
      },
      {
        title: 'Corregir solo en los cerros',
        text: 'En Lorca y La Palma ajustamos la rampa y la atmósfera ligada al relieve en toda la escena. Aquí eso borraba el cuenco: el lecho plano y bajo es justo lo que se hunde. Ajustamos las correcciones solo en los cerros (por encima de 2280 m), que son roca estable.',
      },
      {
        title: '¿Medio metro al año?',
        text: 'Al ritmo de estos 120 días, Chalco bajaría unos 55 cm al año. Pero los dos primeros pares (oct–nov, final de la temporada de lluvias) bajan unos 5 cm cada uno, más que los demás: parte puede ser atmósfera húmeda. La cifra prudente es la medida, 22 cm en 4 meses.',
      },
      {
        title: 'Por qué paramos en febrero',
        text: 'Desde finales de febrero la coherencia en Chalco cae por debajo de 0,3 (campos en temporada seca). Esos pares no tienen dato allí y aplanarían la serie, así que la cortamos.',
      },
    ],
    who: [
      { title: 'Gestión del agua (CONAGUA)', text: 'Ver cada 12 días dónde el bombeo hunde más el terreno, para repartir los pozos.' },
      { title: 'Metro e infraestructuras', text: 'El hundimiento desigual rompe tuberías, deforma vías y daña la línea 12 del metro y edificios históricos.' },
      { title: 'Protección civil', text: 'Un terreno que baja cambia por dónde corre el agua en las inundaciones.' },
    ],
  },
  langtang: {
    short: 'Langtang Lirung',
    region: 'Nepal',
    kindLabel: 'Antes del colapso',
    order: 12,
    place: 'Cara norte del Langtang Lirung · Rasuwa (Nepal)',
    dateLabel: 'may–ago 2026',
    headline: 'Langtang Lirung: ¿avisó el glaciar antes de caer?',
    summary:
      'El 26 de agosto se desplomó la cara norte del Langtang Lirung, la avalancha de roca y hielo que originó la riada de Rasuwa. Miramos las 12 semanas anteriores con 6 interferogramas NISAR (27 may → 19 ago). El hielo que se rompió no se puede medir: pierde coherencia y el producto oficial lo descarta. En la ladera, a 1,7 km, el suelo se acerca al satélite 4,5 cm, 2,4 de ellos en las últimas tres semanas, apenas por encima del ruido (±2,8 cm). Pero en esas mismas tres semanas otras 9 zonas de esta escena se mueven más de 5 cm. NISAR vio moverse la montaña, no cuál iba a caer.',
    notes: [{ date: '2026-08-19', label: 'Última pasada antes' }],
    why: [
      {
        title: 'El hielo no deja medir',
        text: 'La interferometría compara la fase de dos pasadas. Sobre un glaciar el hielo se funde, fluye y cambia cada día, la coherencia cae (0,26 junto al punto de rotura) y el desenrollado oficial lo deja fuera. Por eso el máximo lo buscamos en la roca de alrededor.',
      },
      {
        title: 'Lo que dicen otros estudios',
        text: 'ICIMOD midió con NISAR hasta 30 cm en esa ladera entre el 26 jul y el 19 ago, y un artículo en Remote Sensing (MDPI, 2026) ve 5–6 cm de subida aparente en el flanco norte del valle. Nuestro procesado da el mismo orden en la ladera (+4,5 cm). Los 30 cm probablemente salen de técnicas que sí miden el hielo (correlación de imágenes), que aquí no usamos.',
      },
      {
        title: 'Moverse no es avisar',
        text: 'Otro estudio encontró 101 zonas más moviéndose ladera abajo en la región, 93 de ellas glaciares. Un glaciar de montaña siempre se mueve: el reto es distinguir el movimiento normal de la aceleración que precede a una rotura. Con una imagen cada 12 días, eso aún no es una alerta.',
      },
      {
        title: 'Qué haría falta',
        text: 'Las pasadas ascendente y descendente juntas (aquí la 48 desc solo cubre la mitad de la escena), técnicas de seguimiento del hielo y sensores en el terreno. NISAR da el mapa de dónde mirar.',
      },
    ],
    who: [
      { title: 'Vigilancia glaciar (ICIMOD, DHM)', text: 'Un inventario de laderas y glaciares que se aceleran, renovado cada 12 días.' },
      { title: 'Hidroeléctricas', text: 'Doce centrales dañadas: saber qué cabeceras vigilar antes de construir o reabrir.' },
      { title: 'Comunidades del valle', text: 'Sistemas de alerta río abajo, donde unos minutos de aviso salvan vidas.' },
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
    kindLabel: 'Collapse and flood',
    place: 'Langtang Lirung · Lhende River · Rasuwa (Nepal)',
    dateLabel: '26 Aug 2026',
    headline: 'Rasuwa: the mountain that came down, seen through the monsoon',
    summary:
      'At 8:37 local time on 26 August 2026, at the height of the monsoon, the north face of Langtang Lirung gave way: a rock–ice avalanche at about 5,300 m turned into a debris flow, dammed the Lhende River on the Tibet border and, when the dam broke, ran 72 km down the Bhote Koshi–Trishuli. Over 1,400 dead and thousands missing; homes, bridges, roads and 12 hydropower plants damaged (Copernicus EMSR927 activation). While clouds blinded optical satellites for five weeks, NISAR (ascending track 98, 19 → 31 Aug) mapped 633 ha of debris tongue and scoured gorge, with a −3.4 dB mean HV drop where the surge stripped the forest. The slope that was moving before it failed is in the “Langtang Lirung” case.',
    notes: [{ date: '2026-08-26', label: 'Collapse and flood' }],
    why: [
      { title: 'Seeing through five weeks of monsoon', text: 'Between 24 August and 28 September every Sentinel-2 optical pass had 49% to 97% cloud cover; the first clear view arrived on 1 October. NISAR mapped the full extent five days after the collapse.' },
      { title: 'Debris tongue and scoured gorge', text: 'The HV drop (−3.4 dB on average) traces both the detachment lobe below the north face (211 ha of bare rock and ice) and the 254 ha of subalpine and riparian forest stripped along the canyon down towards Syaphrubesi.' },
      { title: 'Not a glacial lake', text: 'Copernicus EMS activated its mapping as a glacial lake outburst flood (GLOF), and that is how it was first reported. Later analyses (USGS seismograms, optical imagery) point to a rock–ice collapse that temporarily dammed the Lhende, whose release fed the flood.' },
      { title: 'Geometry in 5,000 m canyons', text: 'In deep Himalayan gorges viewing geometry is critical: ascending track 98 (40 MHz DHDH mode) covers 100% of the valley seamlessly, whereas descending track 48 on 28 August left a sub-swath gap across the headwall.' },
      { title: 'Rain every day before the failure', text: 'ERA5 reanalysis records rain every day from 15 August to 5 September (323 mm in total, 125.5 mm between the two NISAR passes alone), saturating slopes and moraines.' },
      { title: 'No official comparison', text: 'NASA has not published a NISAR image of this event: the result is ours alone. What is flagged is a strong signal drop, not confirmed damage; it should be checked against the EMSR927 layers or optical imagery.' },
    ],
    who: [
      { title: 'Disaster response (NDRRMA)', text: 'Pinpoint within hours which sections of the Pasang Lhamu Highway (0.6 km directly hit) and settlements such as Syaphrubesi are cut off under monsoon cloud.' },
      { title: 'Glacier monitoring (ICIMOD)', text: 'Detect rock–ice avalanches and glacial lake outbursts without waiting for the monsoon to end.' },
      { title: 'Hydropower and river basins', text: 'Assess boulder and sediment surges along the Trishuli corridor, where about 2,880 people live within 1 km of the channel.' },
      { title: 'Cross-border cooperation', text: 'The river crosses the border twice: share radar monitoring of the headwaters between Nepal and China.' },
    ],
  },
  lorca: {
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
    headline: 'Venezuela: the Mw 7.2 and 7.5 doublet that broke the coast in 32 seconds',
    summary:
      'On 24 June 2026 a shallow earthquake doublet (10 km depth, USGS) ruptured the Caribbean–South American plate boundary: an Mw 7.2 struck at 18:04:31 local time (22:04:31 UTC) 20 km east of San Felipe, Yaracuy (10.371° N, 68.556° W), followed 32 seconds later, at 18:05:03 local time (22:05:03 UTC), by the Mw 7.5 mainshock 17 km west of Catia La Mar, La Guaira (10.622° N, 67.194° W). Just 12 hours later NISAR ascending track 162 covered both epicentres; with tracks 54, 61 and 126, four interferograms show line-of-sight displacements of up to −37.9 and +32.7 cm and over 102,000 ha moving above the noise. NASA published its own map (up to ~60 cm westward next to Maiquetía airport): seen through the radar’s slanted look, that horizontal motion amounts to about 33–42 cm, just what our independent processing measures.',
    notes: [{ date: '2026-06-24', label: 'Mw 7.2 + 7.5' }],
    officialClaim: 'Up to ~60 cm of displacement, mostly horizontal and westward, next to the international airport north of Caracas.',
    why: [
      { title: 'Opposite signs = right-lateral strike-slip', text: 'In an ascending orbit the radar looks east; in a descending orbit it looks west. Along the Mw 7.5 coast (Chichiriviche–Catia La Mar), ascending tracks 162 and 61 measure −32.3 and −37.9 cm (moving away from the satellite), while descending track 126 measures +32.7 cm (moving towards it). That sign reversal points to horizontal right-lateral (dextral) motion along the San Sebastián fault.' },
      { title: 'How it matches NASA’s map', text: 'Radar only sees the part of the motion along its line of sight, tilted 33° to 47°. A ~60 cm westward horizontal shift, as in JPL’s map, projects to about 33–42 cm: the same range as our four tracks, processed without using their map.' },
      { title: 'The Morón fault trace exposed', text: 'In the western rupture zone (Mw 7.2, San Felipe–Morón), the interferogram slices east–west across the Golfo Triste coast: the northern block shifts westwards (+30.5 cm on ascending track 162; −23.7 cm on descending track 54) relative to the southern block, over half a metre of relative offset across the fault.' },
      { title: 'L-band through tropical cloud forest', text: 'The Cordillera de la Costa (Henri Pittier, Sierra de Aroa and El Ávila, up to 2,765 m) is covered in dense cloud forest where C-band loses coherence within days. NISAR’s 23.8 cm wavelength penetrates the canopy and resolves full 11.9 cm fringes without phase jumps.' },
      { title: '12-hour response and ionospheric screen', text: 'Ascending track 162 flew over Venezuela at 10:06 UTC on 25 June, only 12 hours after the doublet. At 10° N across a 235 km scene, the split-spectrum ionospheric screen in the GUNW product helps isolate the tectonic signal.' },
      { title: 'No data over the sea', text: 'Water changes from moment to moment and radar cannot compare two passes over it. The Mw 7.5 epicentre is offshore, so the motion is measured on land, on the coastal strip between Catia La Mar and La Guaira.' },
    ],
    who: [
      { title: 'FUNVISIS & USGS', text: 'Invert coseismic slip on the Morón and San Sebastián faults by combining all four ascending and descending viewing geometries.' },
      { title: 'Civil protection & ports', text: 'Pinpoint coastal sectors with the strongest shaking, subsidence and liquefaction around Puerto Cabello, Morón, Catia La Mar and La Guaira.' },
      { title: 'Critical infrastructure', text: 'Prioritise inspections of Maiquetía airport, the Caracas–La Guaira and Valencia–Puerto Cabello highways, coastal refineries and steep mountain slopes.' },
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
  krasheninnikov: {
    ...CONTENT_ES.krasheninnikov,
    place: 'Krasheninnikov volcano · Kamchatka (Russia)',
    dateLabel: 'Jun–Oct 2026',
    headline: 'Krasheninnikov: the volcano that woke after centuries',
    summary:
      'Four days after the M8.8 Kamchatka earthquake (30 Jul 2025), Krasheninnikov erupted for the first time in about 500 years. Public NISAR data over the volcano start in June 2026: across 11 images from track 80, new bright lobes appear at the north-eastern front of the lava flow. Over the areas that brighten, HH rises from −14 dB in June to −4.5 dB on 18 August and then levels off, as if the flow stopped advancing in mid-summer.',
    notes: [{ date: '2026-08-18', label: 'Levels off' }],
    officialClaim: '17-frame NISAR time-lapse (25 Dec 2025 – 17 Aug 2026): lava fills an inner caldera, overflows into the wider crater and fans out to the east.',
    why: [
      { title: 'Lava is bright to radar', text: 'Fresh rock is rough at the scale of the wave (24 cm) and returns strong signal in both HH and HV. Wet snow and smooth ground return little.' },
      { title: 'Summer is misleading', text: 'From June to August snow melts and slopes dry out: almost the whole volcano brightens. So we compare 13 Jul with 23 Sep, both snow-free, and only within 7 km of the crater. Even so, part of what is flagged to the south-west is snow patches disappearing, not lava.' },
      { title: 'What we cannot see', text: 'NASA has images from 25 Dec 2025, but the public ones at ASF start on 19 Jun 2026. The start of the eruption (August 2025) predates NISAR.' },
      { title: 'Remote, but it matters', text: 'Kamchatka is almost uninhabited, but ash from its volcanoes crosses North Pacific air routes. A radar that sees through cloud and at night follows the eruption regardless of weather.' },
    ],
    who: [
      { title: 'Volcano observatories', text: 'Track the flow every 12 days through cloud and polar night.' },
      { title: 'Aviation', text: 'Knowing whether the eruption is still active helps set ash alerts on North Pacific routes.' },
      { title: 'Science', text: 'A volcano woken by an M8.8: a rare case to understand how earthquakes trigger eruptions.' },
    ],
  },
  mozambique: {
    ...CONTENT_ES.mozambique,
    region: 'Mozambique',
    place: 'Chókwè · lower Limpopo (Mozambique)',
    dateLabel: '5–17 Jan 2026',
    headline: 'Limpopo: the river that left its valley',
    summary:
      'December and January rains pushed the Limpopo and Incomati rivers over their banks in southern Mozambique: according to NASA, over 600,000 people displaced and 30,000 homes flooded. Between 5 and 17 January NISAR sees 325 km² of new water appear, mostly on the Limpopo floodplain and the Chókwè irrigation scheme, through the clouds that blocked optical satellites. Another 472 km² were water on both dates: rivers, lagoons and areas already flooded on 5 January.',
    notes: [{ date: '2026-01-17', label: 'Flood' }],
    officialClaim: 'Before/after comparison (5 and 17 Jan) of the Limpopo and Incomati basins: radar sees water under the clouds that blocked Sentinel-2. Over 600,000 people displaced.',
    why: [
      { title: 'Water is a mirror', text: 'As in the Valencia storm, a sheet of water reflects the pulse away from the satellite: the flooded plain drops from −11 to −17 dB in HH. Here the water stays for weeks on an almost flat plain, and the 17 January pass catches it in full.' },
      { title: 'Everything else brightens', text: 'Soaked soil returns more signal: almost the whole scene brightens between 5 and 17 January. So we require both a drop of at least 3 dB and a value below −14 dB, the valley between water (−18 dB) and wet land (−6 dB).' },
      { title: 'What radar misses', text: 'Under trees or tall crops water does not darken: it bounces off the trunks and shines (double bounce). That flooded forest is not in our mask, so the real area is larger.' },
      { title: 'Same technique as in Spain', text: 'This is the same pipeline as in La Safor. The difference is time: in Valencia the water drained within hours and no radar came in time; on the Limpopo it lasts weeks and NISAR sees it.' },
    ],
    who: [
      { title: 'Civil protection (INGD)', text: 'Where the water is despite the clouds, to evacuate and bring aid.' },
      { title: 'Agriculture', text: 'Which plots of the Chókwè irrigation scheme went under water, to estimate crop losses.' },
      { title: 'Basin management', text: 'Calibrate flood models of the Limpopo, which crosses four countries.' },
    ],
  },
  cdmx: {
    ...CONTENT_ES.cdmx,
    short: 'Mexico City',
    region: 'Mexico',
    place: 'Valley of Mexico · Chalco (Mexico)',
    dateLabel: 'Oct 2025 – Feb 2026',
    headline: 'Mexico City: a city sinking in plain sight',
    summary:
      'Mexico City is built on an ancient lakebed and pumps water from its aquifer: the clay compacts and the city sinks. With 10 chained NISAR interferograms (25 Oct → 22 Feb), about 37,500 ha of the old lake drop by more than the noise (±1 cm). In Chalco, to the south-east, subsidence reaches 22 cm in 120 days. It is the same process as in Lorca, but several times faster.',
    officialClaim: 'NISAR map from 25 Oct 2025 to 17 Jan 2026: dark blue areas are sinking by more than 2 cm per month, mainly from groundwater pumping.',
    why: [
      { title: 'A lake drained from below', text: 'The clays of the old Lake Texcoco hold a lot of water. When the aquifer is pumped they lose pressure and compact: the ground goes down and does not come back.' },
      { title: 'Correct on the hills only', text: 'In Lorca and La Palma we fit the ramp and height-related atmosphere over the whole scene. Here that erased the bowl: the low, flat lakebed is exactly what sinks. We fit the corrections only on the hills (above 2,280 m), which are stable rock.' },
      { title: 'Half a metre a year?', text: 'At the pace of these 120 days, Chalco would sink about 55 cm a year. But the first two pairs (Oct–Nov, end of the rainy season) drop about 5 cm each, more than the rest: part may be wet atmosphere. The safe figure is the measured one, 22 cm in 4 months.' },
      { title: 'Why we stop in February', text: 'From late February coherence in Chalco falls below 0.3 (fields in the dry season). Those pairs have no data there and would flatten the series, so we cut it.' },
    ],
    who: [
      { title: 'Water management (CONAGUA)', text: 'See every 12 days where pumping sinks the ground most, to rebalance the wells.' },
      { title: 'Metro and infrastructure', text: 'Uneven subsidence breaks pipes, warps tracks and damages Metro Line 12 and historic buildings.' },
      { title: 'Civil protection', text: 'Sinking ground changes where water runs during floods.' },
    ],
  },
  langtang: {
    ...CONTENT_ES.langtang,
    kindLabel: 'Before the collapse',
    place: 'North face of Langtang Lirung · Rasuwa (Nepal)',
    dateLabel: 'May–Aug 2026',
    headline: 'Langtang Lirung: did the glacier warn before it fell?',
    summary:
      'On 26 August the north face of Langtang Lirung collapsed: the rock–ice avalanche behind the Rasuwa flood. We look at the 12 weeks before with 6 NISAR interferograms (27 May → 19 Aug). The ice that broke cannot be measured: it loses coherence and the official product drops it. On the slope 1.7 km away the ground moves 4.5 cm towards the satellite, 2.4 of them in the last three weeks, just above the noise (±2.8 cm). But in those same three weeks 9 other areas of this scene move by more than 5 cm. NISAR saw the mountain moving, not which part would fall.',
    notes: [{ date: '2026-08-19', label: 'Last pass before' }],
    why: [
      { title: 'Ice cannot be measured', text: 'Interferometry compares the phase of two passes. On a glacier the ice melts, flows and changes every day, coherence drops (0.26 next to the failure point) and the official unwrapping leaves it out. So we look for the maximum on the surrounding rock.' },
      { title: 'What other studies say', text: 'ICIMOD measured up to 30 cm with NISAR on that slope between 26 Jul and 19 Aug, and a paper in Remote Sensing (MDPI, 2026) sees 5–6 cm of apparent uplift on the northern valley flank. Our processing gives the same order on the slope (+4.5 cm). The 30 cm probably come from techniques that do track ice (image correlation), which we do not use here.' },
      { title: 'Moving is not warning', text: 'Another study found 101 more areas moving downslope in the region, 93 of them glaciers. A mountain glacier always moves: the challenge is telling normal motion from the acceleration before a failure. With one image every 12 days, that is not yet a warning.' },
      { title: 'What it would take', text: 'Ascending and descending tracks together (here descending track 48 only covers half the scene), ice-tracking techniques and ground sensors. NISAR provides the map of where to look.' },
    ],
    who: [
      { title: 'Glacier monitoring (ICIMOD, DHM)', text: 'An inventory of accelerating slopes and glaciers, refreshed every 12 days.' },
      { title: 'Hydropower', text: 'Twelve plants damaged: know which headwaters to watch before building or reopening.' },
      { title: 'Valley communities', text: 'Warning systems downstream, where a few minutes of notice save lives.' },
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
