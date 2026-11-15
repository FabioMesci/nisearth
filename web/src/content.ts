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
  // ---- NISAR en el mundo: eventos difundidos por NASA/JPL, procesados con nuestro pipeline ----
  venezuela: {
    short: 'Caracas',
    region: 'Venezuela',
    order: 7,
    place: 'Caracas · La Guaira (Venezuela)',
    dateLabel: '24 jun 2026',
    headline: 'Venezuela: la costa que se movió medio metro',
    summary:
      'El 24 de junio dos terremotos sacudieron el norte de Venezuela: un M7,2 y, medio minuto después, un M7,5 frente a Catia La Mar (USGS). Tres interferogramas NISAR de tres pasadas distintas ven la franja costera de La Guaira moverse hasta 59 cm en la línea de visión del satélite. NASA publicó su propio mapa con los mismos datos (hasta ~60 cm hacia el oeste junto al aeropuerto); nuestro procesado, hecho de forma independiente, llega al mismo orden de magnitud.',
    notes: [{ date: '2026-06-24', label: 'M7,5' }],
    officialClaim: 'Hasta ~60 cm de desplazamiento, sobre todo horizontal y hacia el oeste, junto al aeropuerto internacional al norte de Caracas.',
    why: [
      {
        title: 'Una falla de desgarre',
        text: 'La falla de San Sebastián corre paralela a la costa, bajo el mar. En un desgarre los bloques se deslizan en horizontal, uno junto al otro: por eso el movimiento se concentra en la franja costera.',
      },
      {
        title: 'Dos miradas, dos colores',
        text: 'Las pasadas ascendentes miran hacia el este y las descendentes hacia el oeste. Un mismo movimiento horizontal se ve como «alejarse» en unas y «acercarse» en otras: la costa sale roja en las pasadas 162 y 61 y azul en buena parte de la 126.',
      },
      {
        title: 'Sin datos en el mar',
        text: 'El agua cambia en cada instante y el radar no puede comparar dos pasadas sobre ella. El epicentro del M7,5 está en el mar: el máximo lo medimos en tierra, en la costa entre Maiquetía y La Guaira.',
      },
      {
        title: 'Sin rampa ni corrección de relieve',
        text: 'En Granada o Lorca quitamos una rampa y la atmósfera ligada al relieve. Aquí la deformación ocupa casi toda la escena y esas correcciones borrarían señal real: fijamos el cero en el interior, a ~20 km de la costa, y nada más. El precio es más ruido atmosférico (±6 cm), pequeño frente a 59 cm.',
      },
    ],
    who: [
      { title: 'Emergencias', text: 'Un mapa de qué tramos de costa se movieron más, en días y aunque haya nubes.' },
      { title: 'Sismología', text: 'Con pasadas ascendentes y descendentes se separa el movimiento horizontal del vertical para modelar la falla.' },
      { title: 'Infraestructuras', text: 'El aeropuerto de Maiquetía, el puerto de La Guaira y la autopista a Caracas están en la franja que más se movió.' },
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
  nepal: {
    short: 'Rasuwa',
    region: 'Nepal',
    order: 11,
    place: 'Bhote Koshi – Trishuli · Rasuwa (Nepal)',
    dateLabel: '26 ago 2026',
    headline: 'Rasuwa: la riada que nació en un glaciar',
    summary:
      'El 26 de agosto, a las 8:37 hora local, se desplomó la cara norte del Langtang Lirung: una avalancha de roca y hielo a unos 5300 m que se convirtió en un flujo de derrubios, represó el río Lhende en la frontera con el Tíbet y bajó 72 km por el Bhote Koshi–Trishuli. Más de 1400 muertos y miles de desaparecidos; viviendas, puentes, carreteras y 12 centrales hidroeléctricas dañadas. NISAR pasó 7 días antes y 5 después: el agua ya se había ido, pero en 385 ha del fondo del valle la señal radar cambia más de 3 dB. El origen, la ladera que se movía antes de romperse, está en el caso «Langtang Lirung».',
    notes: [{ date: '2026-08-26', label: 'Riada' }],
    why: [
      {
        title: 'El agua se va, la cicatriz se queda',
        text: 'Como en la DANA, una riada relámpago en un valle encajado drena en horas. Lo que el radar sí ve es el cauce cambiado: sedimento y bloques nuevos, márgenes comidas, vegetación de ribera arrancada. Eso altera HH y HV aunque no quede agua.',
      },
      {
        title: 'Solo en el fondo del valle',
        text: 'En el Himalaya las laderas son tan empinadas que el radar ve zonas en sombra o plegadas sobre sí mismas (layover), con cambios que no son reales. Por eso buscamos cambios solo a menos de 300 m de los ríos de OpenStreetMap (303 km de cauce).',
      },
      {
        title: 'Sin comparación oficial',
        text: 'Es el único caso mundial sin imagen NISAR publicada por NASA: el resultado es solo nuestro. Lo marcado es «cambio fuerte», no daño confirmado; habría que validarlo con imágenes ópticas o datos sobre el terreno.',
      },
      {
        title: 'No fue un lago glaciar',
        text: 'Al principio se habló de un desbordamiento de lago glaciar (GLOF). Los análisis posteriores (sismogramas del USGS, imágenes ópticas) apuntan a un colapso de roca y hielo que represó temporalmente el Lhende, cuyo vaciado alimentó la riada.',
      },
    ],
    who: [
      { title: 'Gestión de desastres (NDRRMA)', text: 'Qué tramos del valle cambiaron más, aunque el monzón tape a los satélites ópticos.' },
      { title: 'Hidroeléctricas y carreteras', text: 'Priorizar inspecciones de presas, puentes y de la carretera a la frontera de Rasuwagadhi.' },
      { title: 'Cooperación transfronteriza', text: 'El río cruza la frontera dos veces: compartir vigilancia radar de la cabecera entre Nepal y China.' },
    ],
  },
  langtang: {
    short: 'Langtang Lirung',
    region: 'Nepal',
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
  venezuela: {
    ...CONTENT_ES.venezuela,
    place: 'Caracas · La Guaira (Venezuela)',
    dateLabel: '24 Jun 2026',
    headline: 'Venezuela: the coast that moved half a metre',
    summary:
      'On 24 June two earthquakes shook northern Venezuela: an M7.2 and, half a minute later, an M7.5 offshore Catia La Mar (USGS). Three NISAR interferograms from three different tracks see the La Guaira coastal strip move up to 59 cm along the satellite line of sight. NASA published its own map from the same data (up to ~60 cm westward next to the airport); our independent processing reaches the same order of magnitude.',
    notes: [{ date: '2026-06-24', label: 'M7.5' }],
    officialClaim: 'Up to ~60 cm of displacement, mostly horizontal and westward, next to the international airport north of Caracas.',
    why: [
      { title: 'A strike-slip fault', text: 'The San Sebastián fault runs parallel to the coast, under the sea. In a strike-slip quake the blocks slide past each other horizontally, so the motion concentrates on the coastal strip.' },
      { title: 'Two views, two colours', text: 'Ascending tracks look east and descending tracks look west. The same horizontal motion reads as “away” in one and “towards” in the other: the coast is red in tracks 162 and 61 and blue over much of track 126.' },
      { title: 'No data over the sea', text: 'Water changes from moment to moment and radar cannot compare two passes over it. The M7.5 epicentre is offshore, so we measure the maximum on land, on the coast between Maiquetía and La Guaira.' },
      { title: 'No ramp, no height correction', text: 'In Granada or Lorca we remove a ramp and height-related atmosphere. Here the deformation fills almost the whole scene and those corrections would erase real signal: we set zero inland, ~20 km from the coast, and nothing more. The cost is more atmospheric noise (±6 cm), small next to 59 cm.' },
    ],
    who: [
      { title: 'Emergency services', text: 'A map of which stretches of coast moved most, within days and through clouds.' },
      { title: 'Seismology', text: 'Ascending and descending tracks together separate horizontal from vertical motion to model the fault.' },
      { title: 'Infrastructure', text: 'Maiquetía airport, the port of La Guaira and the motorway to Caracas sit in the strip that moved most.' },
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
  nepal: {
    ...CONTENT_ES.nepal,
    place: 'Bhote Koshi – Trishuli · Rasuwa (Nepal)',
    dateLabel: '26 Aug 2026',
    headline: 'Rasuwa: the flood that started in a glacier',
    summary:
      'At 8:37 local time on 26 August the north face of Langtang Lirung gave way: a rock–ice avalanche at about 5,300 m turned into a debris flow, dammed the Lhende River on the Tibet border and ran 72 km down the Bhote Koshi–Trishuli. Over 1,400 dead and thousands missing; homes, bridges, roads and 12 hydropower plants damaged. NISAR passed 7 days before and 5 after: the water was gone, but over 385 ha of valley floor the radar signal changes by more than 3 dB. The source, the slope that was moving before it failed, is in the “Langtang Lirung” case.',
    notes: [{ date: '2026-08-26', label: 'Flood' }],
    why: [
      { title: 'The water leaves, the scar stays', text: 'As in the Valencia storm, a flash flood in a deep valley drains within hours. What radar does see is the changed channel: new sediment and boulders, eroded banks, stripped riverside vegetation. That alters HH and HV even with no water left.' },
      { title: 'Only on the valley floor', text: 'Himalayan slopes are so steep that radar sees areas in shadow or folded onto themselves (layover), with changes that are not real. So we only look for change within 300 m of OpenStreetMap rivers (303 km of channel).' },
      { title: 'No official comparison', text: 'This is the only world case without a NISAR image published by NASA: the result is ours alone. What is flagged is “strong change”, not confirmed damage; it should be checked against optical imagery or field data.' },
      { title: 'Not a glacial lake', text: 'Early reports spoke of a glacial lake outburst (GLOF). Later analyses (USGS seismograms, optical imagery) point to a rock–ice collapse that temporarily dammed the Lhende, whose release fed the flood.' },
    ],
    who: [
      { title: 'Disaster management (NDRRMA)', text: 'Which stretches of the valley changed most, even when the monsoon blinds optical satellites.' },
      { title: 'Hydropower and roads', text: 'Prioritise inspections of dams, bridges and the road to the Rasuwagadhi border crossing.' },
      { title: 'Cross-border cooperation', text: 'The river crosses the border twice: share radar monitoring of the headwaters between Nepal and China.' },
    ],
  },
  langtang: {
    ...CONTENT_ES.langtang,
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
  { title: 'All year round: ground on the move', text: 'With interferometry NISAR measures centimetres. In Lorca the valley sinks about 16 cm a year from aquifer pumping. In Granada, La Palma and Álora radar bounds what did not move: a magnitude 5.2 earthquake that deformed the ground less than 1 cm, a lava flow that has almost stopped settling and a high-speed rail slope that is stable after repair.', target: 'lorca' },
  { title: 'What NISAR can do', text: 'NISAR sees day and night, through clouds and smoke, and tells fire from harvest thanks to its polarizations. Combined with other radars and tasked in time, it can become a warning system for decision-makers.', target: null },
]

export const CONTENT = new Proxy({} as Record<string, CaseContent>, {
  get: (_, id: string) => (lang === 'en' ? CONTENT_EN : CONTENT_ES)[id],
})
export const getStory = () => (lang === 'en' ? STORY_EN : STORY_ES)
