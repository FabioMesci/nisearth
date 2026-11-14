# España desde el radar · Spain through radar

**NASA Space Apps Challenge 2026 · Dancing with the SARs**

Aplicación web interactiva que usa datos del radar **NISAR** (NASA-ISRO, banda L) y **Sentinel-1** (ESA, banda C)
para seguir los cambios que dejaron en la superficie de España dos desastres de 2026:

| Caso | Qué muestra el radar |
|---|---|
| 🔥 **Incendio de Niebla (Huelva), agosto 2026** | Cicatriz del fuego medida a través del humo: ~32.000 ha, 89 % dentro del perímetro oficial EFFIS. Regla física: el fuego hace caer HV (volumen de hojas y ramas) pero no HH; la cosecha hace caer las dos. |
| 💧 **DANA Adam, La Safor (Valencia), octubre 2026** | Lo que el radar *no* llegó a ver: ningún radar pasó durante la tormenta (4,5 días sin datos) y, cuando NISAR volvió, el agua ya había drenado. Argumento para coordinar constelaciones radar en emergencias. |

Un globo 3D (three.js / globe.gl) lleva a una vista detallada (MapLibre) con deslizador antes/después,
serie temporal animada, selector de polarización (HH/HV/RGB) y de banda (L/C), máscaras, infraestructuras
afectadas (OpenStreetMap) y validación con EFFIS.

---

## Estructura

```
pipeline/            Procesado de datos (Python)
  config.py          Casos de estudio: zona, fechas, pares antes/después
  01_search.py       Busca las imágenes NISAR GCOV en ASF
  02_extract.py      Lee SOLO el recorte de cada HDF5 (1-2 GB) por HTTPS y lo lleva a una rejilla común
  s1_hyp3.py         Sentinel-1: procesado RTC en HyP3 (ASF) y recorte a la misma rejilla
  03_process.py      Filtro de speckle, detección de cambio, máscaras, serie temporal, PNG + manifest.json
  04_context.py      Cruce con OpenStreetMap (vías, carreteras) y validación con EFFIS / Copernicus EMS
  05_external.py     NASA FIRMS, lluvia Open-Meteo y panel de vigilancia
  06_exposure.py     Cobertura del suelo (ESA WorldCover) y población (WorldPop) bajo cada máscara
  07_risk.py         Risk index per grid cell (hazard x exposure x vulnerability), cascades, CSV/GeoJSON export
  make_mock.py       Datos de prueba con el mismo formato (para desarrollar la web sin datos)
web/                 Aplicación (Vite + TypeScript + globe.gl + MapLibre + Chart.js)
  public/data/       Salida del pipeline (lo único que necesita la web)
  src/content.ts     Textos editoriales de cada caso
```

## Reproducir

### 1. Credenciales
Cuenta gratuita en [NASA Earthdata](https://urs.earthdata.nasa.gov). Copia `.env.example` a `.env` y rellena
`EARTHDATA_TOKEN` (recomendado) o usuario y contraseña. `.env` está en `.gitignore`.

### 2. Pipeline
```bash
python3 -m venv .venv && .venv/bin/pip install -r pipeline/requirements.txt
cd pipeline
../.venv/bin/python 01_search.py                    # lista de imágenes NISAR por caso
../.venv/bin/python 02_extract.py niebla --track 23 # serie temporal (solo el recorte, ~1 min por imagen)
../.venv/bin/python 02_extract.py dana --track 167
../.venv/bin/python s1_hyp3.py submit               # Sentinel-1 (opcional, ~30-60 min en ASF)
../.venv/bin/python s1_hyp3.py fetch
../.venv/bin/python 03_process.py niebla && ../.venv/bin/python 04_context.py niebla && ../.venv/bin/python 06_exposure.py niebla
../.venv/bin/python 03_process.py dana   && ../.venv/bin/python 04_context.py dana   && ../.venv/bin/python 06_exposure.py dana
../.venv/bin/python 05_external.py niebla && ../.venv/bin/python 05_external.py dana  # focos FIRMS y lluvia (FIRMS_MAP_KEY en .env)
../.venv/bin/python 05_external.py watch            # panel «Vigilancia España»: repetir justo antes de la demo
```

Risk index (see [docs/EVENTS_AND_RISK.md](docs/EVENTS_AND_RISK.md)):
```bash
../.venv/bin/python 07_risk.py niebla && ../.venv/bin/python 07_risk.py dana
```

### 3. Web
```bash
cd web && npm install && npm run dev     # http://localhost:5173
npm run build                            # web estática en web/dist
```

## Método

- **Datos:** NISAR L2 GCOV (gamma0 RTC, HH y HV, ~20 m), una pasada por caso para que la geometría sea constante
  (Niebla: pasada 23 descendente; La Safor: pasada 167 descendente). Sentinel-1 IW GRD procesado a RTC gamma0 30 m con HyP3.
- **Speckle:** filtro de Lee 5×5 sobre potencia lineal.
- **Incendio:** cambio suavizado (15×15 px ≈ 300 m) entre 21 jul y 26 ago: quemado = ΔHV < −0,6 dB **y** ΔHH > −1,2 dB.
  Umbrales calibrados con el perímetro EFFIS de este incendio (recall 65 %, precisión 89 %, IoU 0,60).
  Sin la condición de HH la precisión cae al 57 %: los campos cosechados se confunden con el fuego.
- **Inundación:** agua nueva = HH(después) < umbral de Otsu **y** ΔHH < −3 dB.
- **Infraestructuras:** líneas de OpenStreetMap (`railway=rail`, carreteras principales) dentro de la máscara.
  En incendios solo se cuenta la zona quemada confirmada (radar ∩ EFFIS).
- **Exposición:** ESA WorldCover 2021 (10 m) bajo la máscara y población WorldPop 2020 (100 m). En Niebla ardieron
  ~28.300 ha de bosque, matorral y pasto (52 % bosque, 42 % matorral); 720 personas viven a menos de 1 km del borde.
  El 73 % de lo que el radar marca fuera de EFFIS es cultivo: restos de cosecha, la principal fuente de falsos positivos.
- **Validación DANA:** Copernicus EMS (EMSR935) cartografió 885 ha inundadas el 20 oct con SPOT/GeoEye.
  NISAR el 23 oct solo veía como agua el 5 % de esa superficie: el agua drenó en tres días.

## Limitaciones (honestas)

- Los umbrales del incendio se calibraron con EFFIS en el mismo evento; no es una validación independiente.
- La imagen NISAR posterior a la DANA es de 4 días después del pico de lluvia: la inundación máxima no se observó.
  Las otras pasadas disponibles (66 desc. y 58 asc.) son del 16 oct, antes de la lluvia, y del 28 oct, aún más tarde.
- Probamos usar el suelo empapado como señal (subida de HH): en cultivos ΔHH = +0,47 dB tras la DANA, dentro de la
  variación normal entre pasadas sin tormenta (−0,9 a +1,1 dB). No es distinguible y no se muestra como resultado.
- La población es una estimación por celdas de 100 m (WorldPop 2020), no un recuento de afectados.
- NISAR no tiene datos públicos sobre España entre febrero y mayo de 2026.

## Fuentes de datos

- NISAR L2 GCOV — NASA/JPL-Caltech & ISRO, distribuido por [ASF DAAC](https://search.asf.alaska.edu)
- Sentinel-1 — Copernicus/ESA, procesado con [ASF HyP3](https://hyp3-docs.asf.alaska.edu)
- Perímetros de incendios — [EFFIS](https://effis.jrc.ec.europa.eu)
- Inundación DANA — [Copernicus EMS Rapid Mapping EMSR935](https://rapidmapping.emergency.copernicus.eu/EMSR935)
- Cobertura del suelo — [ESA WorldCover 2021](https://esa-worldcover.org) (CC BY 4.0)
- Población — [WorldPop](https://www.worldpop.org) 2020, España, 100 m constrained (CC BY 4.0)
- Focos activos — [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov) (VIIRS) · Lluvia — [Open-Meteo](https://open-meteo.com) / ERA5
- Vías y carreteras — © colaboradores de [OpenStreetMap](https://www.openstreetmap.org/copyright) (ODbL)
- Mapa base — Esri World Imagery; texturas del globo — three-globe (NASA Blue Marble)

## Licencia

MIT
