# NISEarth · lo que vio el radar

*De España al mundo con NISAR · From Spain to the world with NISAR*

**NASA Space Apps Challenge 2026 · Dancing with the SARs** · [English version](README.md)

**Web:** https://dancing-with-the-sars-spain.vercel.app (selector ES / EN arriba a la derecha)

> ¿Qué vio el radar en los desastres de España en 2026, y qué se le escapó?

NISAR (NASA-ISRO, banda L) ve de día y de noche, a través de nubes y humo, y mide el movimiento del suelo al
centímetro. Tomamos sus primeros meses de datos públicos sobre España y seguimos seis eventos reales de 2026; después
aplicamos el mismo pipeline a cinco eventos en el resto del mundo. Cada
cifra de la web sale de nuestro propio pipeline con datos NISAR y Sentinel-1, y se contrasta con referencias
independientes (EFFIS, Copernicus EMS, NASA FIRMS, tasas de subsidencia publicadas). Cuando el radar no vio nada, lo
decimos y explicamos por qué. No queremos solo enseñar lo que puede hacer el satélite: también dónde están sus
huecos, para que quien gestiona una emergencia sepa cuándo puede contar con él.

## Los seis casos en España

| Caso | Técnica | Qué muestra el radar |
|---|---|---|
| 🔥 **Incendio de Niebla (Huelva), agosto 2026** | Cambio de retrodispersión (HH/HV) | Cicatriz del fuego medida a través del humo: **~32.100 ha**, **89 %** dentro del perímetro oficial EFFIS; el **94 %** de los focos de NASA FIRMS cae dentro. Regla física: el fuego hace caer HV (volumen de hojas y ramas) pero no HH; la cosecha hace caer las dos. Ardieron 28.300 ha de bosque, matorral y pasto; 720 personas viven a menos de 1 km del borde. |
| ⬇️ **Subsidencia del Alto Guadalentín (Lorca)** | InSAR, 8 pares NISAR GUNW encadenados (jun–oct) | Serie preliminar en línea de visión y precipitación diaria ERA5 para el mismo periodo; [método y limitaciones](docs/LORCA_RAIN.md). |
| 🌋 **Colada del Tajogaite (La Palma)** | InSAR, 9 interferogramas | La colada de 2021 baja **~0,4 cm** frente a su entorno, por debajo del ruido (±1,7 cm): casi ha dejado de asentarse. La lava es muy coherente (0,86). |
| 〰️ **Serie sísmica de Granada (M5,2, 14 ago)** | InSAR, 3 pasadas | Ninguna deformación por encima de ~1 cm. Las dos pasadas descendentes discrepan (+1,3 frente a −0,2 cm): es la atmósfera, no el terremoto. Un límite superior útil. |
| ⛰️ **Talud del AVE en Álora (4 feb)** | InSAR + Sentinel-1 | NISAR no tenía datos hasta junio; Sentinel-1 pasó la víspera y 5 días después. Desde junio la vía reparada se mueve **<1 mm** frente a su entorno. |
| 💧 **DANA Adam, La Safor (Valencia), octubre 2026** | Cambio de retrodispersión + Copernicus EMS | Lo que el radar **no** vio: ningún radar pasó durante la tormenta (4,5 días sin datos). Tres días después del mapa óptico de Copernicus EMS, NISAR solo veía el **5 %** de las 885 ha inundadas. Argumento para coordinar constelaciones radar en emergencias. |

## NISAR en el mundo

El mismo pipeline aplicado a cinco eventos fuera de España. Para cuatro de ellos NASA/JPL publicó su propia imagen NISAR; la web la muestra junto a la nuestra, con su crédito, para poder comparar (la nuestra se procesa de forma independiente con los mismos datos públicos de ASF).

| Caso | Técnica | Qué muestra el radar | Qué dice NASA/JPL |
|---|---|---|---|
| 〰️ **Doblete sísmico de Venezuela (Yaracuy · La Guaira), 24 jun 2026** | InSAR, 4 pasadas NISAR GUNW (2 asc. + 2 desc.) | El **Mw 7,2** (San Felipe, 22:04:31 UTC) y el **Mw 7,5** (Catia La Mar, 22:05:03 UTC, 10 km de profundidad) quedaron cubiertos apenas **12 horas después** por la pasada 162 ascendente. Desplazamiento en línea de visión de hasta **−37,9 cm** y **+32,7 cm**; **102.325 ha** se mueven por encima del ruido (±6,2 cm). | ~60 cm hacia el oeste junto al aeropuerto, que en la mirada inclinada del radar son unos 33–42 cm: lo que medimos |
| 🌋 **Volcán Krasheninnikov (Kamchatka)** | Cambio de retrodispersión, 11 fechas | **161 ha** de lava nueva o más brillante en el frente NE de la colada (13 jul → 23 sep), con una subida media de HH de **+6,9 dB**. Parte de lo marcado son neveros que se funden. | Timelapse de 17 imágenes, dic 2025 – ago 2026 |
| 💧 **Inundaciones del Limpopo (Mozambique, ene 2026)** | Cambio de retrodispersión, 4 fechas | **325 km²** de agua nueva entre el 5 y el 17 ene (umbral −14 dB en el valle del histograma); 5,4 km de vía férrea y 19 km de carreteras bajo el agua (OSM). | Antes/después, >600.000 desplazados |
| ⬇️ **Subsidencia de Ciudad de México** | InSAR, 10 pares encadenados (oct–feb) | Unas **37.500 ha** del antiguo lago se hunden; **−21,9 cm en 120 días** en Chalco. Rampa y relieve ajustados solo en los cerros (> 2.280 m). | > 2 cm/mes |
| ⛰️ **Colapso del Langtang Lirung y riada de Rasuwa (Nepal), 26 ago 2026** | Cambio de retrodispersión (NISAR pasada 98 asc., 13 fechas, + Sentinel-1) e InSAR previo al colapso | El colapso de roca y hielo de la cara norte del Langtang Lirung represó el río Lhende; la riada bajó 72 km (más de 1400 muertos, Copernicus EMSR927). Tras cinco semanas de nubes del monzón, NISAR (19 → 31 ago) cartografía **633 ha** de lengua de derrubios y garganta arrasada con **−3,4 dB** de caída media en HV, 0,6 km de carreteras y **2.884 personas** en el corredor (<1 km). *Antes del colapso* (InSAR, 6 pares encadenados, 27 may → 19 ago) la ladera a 1,7 km se movió **+4,5 cm** (ruido ±2,8 cm), pero otras 9 zonas se movieron más de 5 cm en la misma ventana: NISAR vio moverse la montaña, no qué parte iba a caer. | — (sin imagen de NASA; ICIMOD: hasta 30 cm; *Remote Sensing* 18:3727) |

## Qué hace la web

Un globo 3D (globe.gl / three.js) lleva a un mapa detallado (MapLibre) de cada caso, con:

- deslizador antes/después y serie temporal animada de imágenes radar;
- selector de polarización (HH / HV / RGB) y de banda (NISAR banda L / Sentinel-1 banda C);
- máscaras de cambio, desplazamiento InSAR acumulado y coherencia;
- vías y carreteras afectadas (OpenStreetMap), cobertura del suelo y población expuesta;
- validación con EFFIS, Copernicus EMS y NASA FIRMS;
- índice de riesgo por celda (peligro × exposición × vulnerabilidad, [método](docs/EVENTS_AND_RISK.md)) para Niebla,
  la DANA, el Limpopo, Rasuwa y Ciudad de México, e índice de cribado con el escenario de inundación T100 del SNCZI
  para Lorca;
- panel «Vigilancia España»: fuegos activos hoy en la península (NASA FIRMS) y la próxima pasada de NISAR sobre cada uno;
- guía de riesgos (incendio, inundación, terremoto, deslizamiento, volcán, subsidencia): cómo ve el radar cada uno;
- **informes PDF** de cada incidente (ver abajo);
- modo historia guiado e interfaz completa en español e inglés.

## Informes PDF

Cada panel de incidente tiene un botón **Descargar informe PDF**, y la lista de incidentes, **Informe PDF de todos
los incidentes** (un solo archivo con portada, índice con enlaces y marcadores del PDF por caso y por sección). El
informe se genera en el navegador a partir del mismo `manifest.json` y de los mismos textos que muestra la web, en el
idioma de la interfaz, así que no necesita servidor:

- ficha (fechas, pasadas, adquisiciones, centro, zona de estudio, sensores) y cifras clave;
- mapa de situación sobre Esri World Imagery con la máscara del radar, perímetros oficiales (EFFIS / Copernicus EMS),
  vías y carreteras afectadas, focos FIRMS, terremotos, barra de escala y leyenda;
- línea temporal de pasadas de radar, imágenes antes/después, mapa de cambio y miniatura de cada adquisición;
- InSAR: movimiento total con su escala de color, franjas, coherencia y tabla de interferogramas;
- gráficos: serie HH/HV o de desplazamiento, lluvia o focos por día, banda L frente a banda C y, en Lorca,
  desplazamiento frente a lluvia ERA5;
- cobertura del suelo, población expuesta, índice de riesgo completo (mapa de celdas, clases, factores, celdas de
  mayor riesgo), imagen de comparación de NASA/JPL, textos del caso, parámetros del procesado, fuentes y enlaces a
  los datos abiertos.

Un caso tarda 2–6 s; el informe completo (11 casos, ~84 páginas, ~18 MB), unos 45 s. El código está en
`web/src/report.ts` y usa [jsPDF](https://github.com/parallax/jsPDF), que solo se descarga al pulsar un botón. Las
fuentes estándar del PDF son Latin-1, así que algunos símbolos se escriben en texto plano (`→` como `->`, `−` como
`-`). Sin acceso a las teselas de Esri, los mapas se dibujan sin fondo de satélite y el pie lo indica.

## A quién ayuda

Servicios forestales y protección civil (cicatrices a través del humo, riesgo de erosión tras el fuego),
confederaciones hidrográficas (¿frenan las restricciones de bombeo el hundimiento?), gestores de vías y carreteras
(taludes y terraplenes vigilados cada 12 días), sismólogos y observatorios volcánicos (límites a la deformación) y
coordinadores de emergencias (saber *cuándo* pasará el radar, y cuándo no).

---

## Método

- **Datos:** NISAR L2 GCOV (gamma0 RTC, HH y HV, ~20 m) para incendio e inundación, una pasada por caso para que la
  geometría sea constante (Niebla: pasada 23 descendente; La Safor: pasada 167 descendente). NISAR L2 GUNW
  (interferogramas desenrollados, 80 m) para el movimiento del suelo. Sentinel-1 IW GRD procesado a RTC gamma0 30 m
  con ASF HyP3.
- **Recortes remotos:** cada GCOV o GUNW pesa 1–2 GB. Solo leemos la zona de interés por HTTPS, así que el pipeline
  completo corre en un portátil.
- **Speckle:** filtro de Lee 5×5 sobre potencia lineal.
- **Incendio:** cambio suavizado (15×15 px ≈ 300 m) entre 21 jul y 26 ago: quemado = ΔHV < −0,6 dB **y**
  ΔHH > −1,2 dB. Umbrales calibrados con el perímetro EFFIS de este incendio (recall 65 %, precisión 89 %, IoU 0,60).
  Sin la condición de HH la precisión cae al 57 %: los campos cosechados se confunden con el fuego.
- **Inundación:** agua nueva = HH(después) < umbral de Otsu **y** ΔHH < −3 dB.
- **InSAR:** pares GUNW encadenados, con ajustes de plano y relieve por escena. El convenio de signo del código y
  la referencia espacial de Lorca requieren validación. Hay intervalos de 12 y 24 días y la cadena admite píxeles con
  pares ausentes; véase [método y limitaciones de Lorca](docs/LORCA_RAIN.md).
- **Infraestructuras:** líneas de OpenStreetMap (`railway=rail`, carreteras principales) dentro de la máscara.
  En incendios solo se cuenta la zona quemada confirmada (radar ∩ EFFIS).
- **Exposición:** ESA WorldCover 2021 (10 m) bajo la máscara y población WorldPop 2020 (100 m).
  El 73 % de lo que el radar marca fuera de EFFIS es cultivo: restos de cosecha, la principal fuente de falsos positivos.
- **Validación DANA:** Copernicus EMS (EMSR935) cartografió 885 ha inundadas el 20 oct con SPOT/GeoEye.
  NISAR el 23 oct solo veía como agua el 5 % de esa superficie: el agua drenó en tres días.

## Limitaciones

- Los umbrales del incendio se calibraron con EFFIS en el mismo evento; no es una validación independiente.
- La imagen NISAR posterior a la DANA es de 4 días después del pico de lluvia: la inundación máxima no se observó.
  Las otras pasadas (66 desc. y 58 asc.) son del 16 oct, antes de la lluvia, y del 28 oct, aún más tarde.
- Probamos usar el suelo empapado como señal (subida de HH): en cultivos ΔHH = +0,47 dB, dentro de la variación
  normal entre pasadas (−0,9 a +1,1 dB). No es distinguible y no se muestra como resultado.
- Solo ~4 meses de interferometría NISAR: solo destacan movimientos de centímetros al año. Las velocidades son ajustes
  lineales sobre 108 días, no velocidades a largo plazo.
- La población es una estimación por celdas de 100 m (WorldPop 2020), no un recuento de afectados.
- NISAR no tiene datos públicos sobre España entre febrero y mayo de 2026.

## Estructura

```
pipeline/            Procesado de datos (Python)
  config.py          Casos: zona, fechas, pares antes/después, pasadas
  01_search.py       Busca las imágenes NISAR GCOV en ASF
  02_extract.py      Lee SOLO el recorte de cada HDF5 (1-2 GB) por HTTPS y lo lleva a una rejilla común
  s1_hyp3.py         Sentinel-1: procesado RTC en HyP3 (ASF) y recorte a la misma rejilla
  03_process.py      Filtro de speckle, detección de cambio, máscaras, serie temporal, PNG + manifest.json
  04_context.py      Vías y carreteras de OpenStreetMap; validación con EFFIS / Copernicus EMS
  05_external.py     Focos NASA FIRMS, lluvia Open-Meteo y panel «Vigilancia España»
  06_exposure.py     Cobertura del suelo (ESA WorldCover) y población (WorldPop) bajo cada máscara
  07_risk.py         Índice de riesgo por celda, cascadas, exportación CSV/GeoJSON
  08_insar.py        Interferometría NISAR L2 GUNW: recorte remoto, corrección de rampa y atmósfera,
                     series acumuladas, catálogo EMSC, colada y vías de OSM, Sentinel-1
  09_world.py        «NISAR en el mundo»: imagen oficial de NASA/JPL y región de cada caso
  09_lorca_rain.py   Lorca: precipitación diaria ERA5 (Open-Meteo)
  10_lorca_flood.py  Lorca: capa de inundabilidad T100 del SNCZI (WMS del MITECO)
  11_lorca_risk.py   Lorca: índice de cribado con el escenario T100 del SNCZI
  make_mock.py       Datos de prueba con el mismo formato (para desarrollar la web sin datos)
web/                 Aplicación (Vite + TypeScript + globe.gl + MapLibre + Chart.js)
  public/data/       Salida del pipeline (lo único que necesita la web): manifest.json, imágenes, GeoJSON, CSV
  src/main.ts        Globo, lista de incidentes, modo historia, guía de riesgos
  src/detail.ts      Mapa de detalle (MapLibre): capas de radar, máscaras, superposiciones
  src/panel.ts       Panel lateral de cada caso: controles, cifras, gráficos, tarjeta de riesgo
  src/report.ts      Informes PDF (un caso o todos), cargado bajo demanda
  src/content.ts     Textos de cada caso (ES / EN)
  src/i18n.ts        Textos de la interfaz (ES / EN)
docs/
  EVENTS_AND_RISK.md Eventos, interacción entre riesgos e índice de riesgo (en inglés)
  LORCA_RAIN.md      Lorca: desplazamiento y lluvia, capa T100 e índice de cribado
  WORLD_CANDIDATES.md Cómo se eligieron los casos de «NISAR en el mundo»
```

## Reproducir

### 1. Credenciales
Cuenta gratuita en [NASA Earthdata](https://urs.earthdata.nasa.gov). Copia `.env.example` a `.env` y rellena
`EARTHDATA_TOKEN` (recomendado) o usuario y contraseña. Para los focos de FIRMS, añade `FIRMS_MAP_KEY`.
`.env` está en `.gitignore`.

### 2. Pipeline
```bash
python3 -m venv .venv && .venv/bin/pip install -r pipeline/requirements.txt
cd pipeline
../.venv/bin/python 01_search.py                    # imágenes NISAR por caso
../.venv/bin/python 02_extract.py niebla --track 23 # serie temporal (solo el recorte, ~1 min por imagen)
../.venv/bin/python 02_extract.py dana --track 167
../.venv/bin/python s1_hyp3.py submit               # Sentinel-1 (opcional, ~30-60 min en ASF)
../.venv/bin/python s1_hyp3.py fetch
for c in niebla dana; do
  ../.venv/bin/python 03_process.py $c && ../.venv/bin/python 04_context.py $c \
  && ../.venv/bin/python 06_exposure.py $c && ../.venv/bin/python 05_external.py $c \
  && ../.venv/bin/python 07_risk.py $c
done
for c in granada lorca lapalma alora; do ../.venv/bin/python 08_insar.py all $c; done
# NISAR around the world / NISAR en el mundo
for c in venezuela cdmx; do ../.venv/bin/python 08_insar.py all $c; done
../.venv/bin/python 02_extract.py krasheninnikov --track 80 && ../.venv/bin/python 03_process.py krasheninnikov
../.venv/bin/python 02_extract.py mozambique --track 114 && ../.venv/bin/python 03_process.py mozambique && ../.venv/bin/python 04_context.py mozambique
../.venv/bin/python 02_extract.py rasuwa --track 98 && ../.venv/bin/python 03_process.py rasuwa && ../.venv/bin/python 04_context.py rasuwa \
  && ../.venv/bin/python 06_exposure.py rasuwa && ../.venv/bin/python 05_external.py rasuwa
for c in mozambique rasuwa cdmx; do ../.venv/bin/python 07_risk.py $c; done
../.venv/bin/python 11_lorca_risk.py
../.venv/bin/python 09_world.py                     # NASA/JPL image + "world" region (after processing)
../.venv/bin/python 05_external.py watch            # panel «Vigilancia España»: repetir justo antes de la demo
```
(Álora usa además Sentinel-1: `s1_hyp3.py submit` y `s1_hyp3.py fetch` antes de `08_insar.py context alora`.)

### 3. Web
```bash
cd web && npm install && npm run dev     # http://localhost:5173
npm run build                            # web estática en web/dist
```

## Fuentes de datos

- NISAR L2 GCOV y GUNW — NASA/JPL-Caltech & ISRO, distribuido por [ASF DAAC](https://search.asf.alaska.edu)
- Sentinel-1 — Copernicus/ESA, procesado con [ASF HyP3](https://hyp3-docs.asf.alaska.edu)
- Perímetros de incendios — [EFFIS](https://effis.jrc.ec.europa.eu)
- Inundación DANA — [Copernicus EMS Rapid Mapping EMSR935](https://rapidmapping.emergency.copernicus.eu/EMSR935)
- Inundabilidad (Lorca) — [SNCZI del MITECO](https://www.miteco.gob.es/es/cartografia-y-sig/ide/directorio_datos_servicios/agua.html), escenario T100
- Terremotos — catálogo [EMSC](https://www.emsc-csem.org)
- Cobertura del suelo — [ESA WorldCover 2021](https://esa-worldcover.org) (CC BY 4.0)
- Población — [WorldPop](https://www.worldpop.org) 2020, España, 100 m constrained (CC BY 4.0)
- Focos activos — [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov) (VIIRS) · Lluvia — [Open-Meteo](https://open-meteo.com) / ERA5
- Vías, carreteras y colada de 2021 — © colaboradores de [OpenStreetMap](https://www.openstreetmap.org/copyright) (ODbL)
- Mapa base (web y mapas del PDF) — Esri World Imagery; texturas del globo — three-globe (NASA Blue Marble)

## Licencia

MIT
