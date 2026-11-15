# España desde el radar · Spain through radar

**NASA Space Apps Challenge 2026 · Dancing with the SARs** · [English version](README.md)

**Web:** https://dancing-with-the-sars-spain.vercel.app (selector ES / EN arriba a la derecha)

> ¿Qué vio el radar en los desastres de España en 2026, y qué se le escapó?

NISAR (NASA-ISRO, banda L) ve de día y de noche, a través de nubes y humo, y mide el movimiento del suelo al
centímetro. Tomamos sus primeros meses de datos públicos sobre España y seguimos seis eventos reales de 2026. Cada
cifra de la web sale de nuestro propio pipeline con datos NISAR y Sentinel-1, y se contrasta con referencias
independientes (EFFIS, Copernicus EMS, NASA FIRMS, tasas de subsidencia publicadas). Cuando el radar no vio nada, lo
decimos y explicamos por qué. No queremos solo enseñar lo que puede hacer el satélite: también dónde están sus
huecos, para que quien gestiona una emergencia sepa cuándo puede contar con él.

## Los seis casos

| Caso | Técnica | Qué muestra el radar |
|---|---|---|
| 🔥 **Incendio de Niebla (Huelva), agosto 2026** | Cambio de retrodispersión (HH/HV) | Cicatriz del fuego medida a través del humo: **~32.100 ha**, **89 %** dentro del perímetro oficial EFFIS; el **94 %** de los focos de NASA FIRMS cae dentro. Regla física: el fuego hace caer HV (volumen de hojas y ramas) pero no HH; la cosecha hace caer las dos. Ardieron 28.300 ha de bosque, matorral y pasto; 720 personas viven a menos de 1 km del borde. |
| ⬇️ **Subsidencia del Alto Guadalentín (Lorca)** | InSAR, 8 pares NISAR GUNW encadenados (jun–oct) | El llano se hunde **6 cm en 108 días** (~**16 cm/año**, ajuste lineal; ruido ±1,2 cm), en línea con los máximos publicados (10–16 cm/año). Una detección real. |
| 🌋 **Colada del Tajogaite (La Palma)** | InSAR, 9 interferogramas | La colada de 2021 baja **~0,4 cm** frente a su entorno, por debajo del ruido (±1,7 cm): casi ha dejado de asentarse. La lava es muy coherente (0,86). |
| 〰️ **Serie sísmica de Granada (M5,2, 14 ago)** | InSAR, 3 pasadas | Ninguna deformación por encima de ~1 cm. Las dos pasadas descendentes discrepan (+1,3 frente a −0,2 cm): es la atmósfera, no el terremoto. Un límite superior útil. |
| ⛰️ **Talud del AVE en Álora (4 feb)** | InSAR + Sentinel-1 | NISAR no tenía datos hasta junio; Sentinel-1 pasó la víspera y 5 días después. Desde junio la vía reparada se mueve **<1 mm** frente a su entorno. |
| 💧 **DANA Adam, La Safor (Valencia), octubre 2026** | Cambio de retrodispersión + Copernicus EMS | Lo que el radar **no** vio: ningún radar pasó durante la tormenta (4,5 días sin datos). Tres días después del mapa óptico de Copernicus EMS, NISAR solo veía el **5 %** de las 885 ha inundadas. Argumento para coordinar constelaciones radar en emergencias. |

## Qué hace la web

Un globo 3D (globe.gl / three.js) lleva a un mapa detallado (MapLibre) de cada caso, con:

- deslizador antes/después y serie temporal animada de imágenes radar;
- selector de polarización (HH / HV / RGB) y de banda (NISAR banda L / Sentinel-1 banda C);
- máscaras de cambio, desplazamiento InSAR acumulado y coherencia;
- vías y carreteras afectadas (OpenStreetMap), cobertura del suelo y población expuesta;
- validación con EFFIS, Copernicus EMS y NASA FIRMS;
- índice de riesgo por celda para el incendio y la inundación (peligro × exposición × vulnerabilidad, [método](docs/EVENTS_AND_RISK.md));
- panel «Vigilancia España»: fuegos activos hoy en la península (NASA FIRMS) y la próxima pasada de NISAR sobre cada uno;
- guía de riesgos (incendio, inundación, terremoto, deslizamiento, volcán, subsidencia): cómo ve el radar cada uno;
- modo historia guiado e interfaz completa en español e inglés.

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
- **InSAR:** interferogramas GUNW de 12 días encadenados en una serie acumulada (los retrasos atmosféricos de las
  fechas intermedias se cancelan); se eliminan la rampa y la atmósfera correlada con el relieve excluyendo la zona que
  se deforma; convenio de signo −fase·λ/4π (positivo = hacia el satélite, comprobado en Lorca). La corrección
  ionosférica del producto *añadía* ruido en escenas tan pequeñas (4,7 cm frente a 2,4 cm en Lorca), así que va
  desactivada por defecto.
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
  make_mock.py       Datos de prueba con el mismo formato (para desarrollar la web sin datos)
web/                 Aplicación (Vite + TypeScript + globe.gl + MapLibre + Chart.js)
  public/data/       Salida del pipeline (lo único que necesita la web)
  src/content.ts     Textos de cada caso (ES / EN)
  src/i18n.ts        Textos de la interfaz (ES / EN)
docs/                EVENTS_AND_RISK.md: eventos, interacción entre riesgos e índice de riesgo
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
- Terremotos — catálogo [EMSC](https://www.emsc-csem.org)
- Cobertura del suelo — [ESA WorldCover 2021](https://esa-worldcover.org) (CC BY 4.0)
- Población — [WorldPop](https://www.worldpop.org) 2020, España, 100 m constrained (CC BY 4.0)
- Focos activos — [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov) (VIIRS) · Lluvia — [Open-Meteo](https://open-meteo.com) / ERA5
- Vías, carreteras y colada de 2021 — © colaboradores de [OpenStreetMap](https://www.openstreetmap.org/copyright) (ODbL)
- Mapa base — Esri World Imagery; texturas del globo — three-globe (NASA Blue Marble)

## Licencia

MIT
