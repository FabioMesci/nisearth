"""Configuración de los casos de estudio.

Cada caso define:
- bbox: (lon_min, lat_min, lon_max, lat_max) en grados WGS84
- window: rango de fechas para buscar imágenes (serie temporal)
- event: fecha aproximada del evento
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
WORK = ROOT / "data" / "work"
WEB_DATA = ROOT / "web" / "public" / "data"

CASES = {
    "dana": {
        "title": "DANA Adam — La Safor (Valencia)",
        "kind": "flood",
        "bbox": (-0.30, 38.82, 0.02, 39.08),
        "window": ("2026-06-01", "2026-11-14"),
        "event": "2026-10-19",  # pico de lluvia noche 18-19 oct
        "pair": ("2026-10-11", "2026-10-23"),  # misma pasada 167 desc
        "track": 167,
        "s1_pair": ("2026-10-16", "2026-10-22"),  # Sentinel-1 pasada 8 desc: la imagen más cercana tras la DANA
        # Copernicus EMS Rapid Mapping: inundación cartografiada con SPOT/GeoEye el 20 oct (data/raw/ems/)
        "ems": {"code": "EMSR935", "date": "2026-10-20"},
    },
    "niebla": {
        "title": "Incendio de Niebla (Huelva)",
        "kind": "fire",
        "bbox": (-6.80, 37.36, -6.20, 37.68),  # perímetro EFFIS (id 606000) + margen
        "window": ("2026-06-01", "2026-11-14"),
        "event": "2026-08-06",  # inicio; estabilizado ~15 ago
        "pair": ("2026-07-21", "2026-08-26"),
        "track": 23,
        "s1_pair": ("2026-07-21", "2026-08-26"),  # Sentinel-1: mismas fechas que NISAR
        "s1_track": 147,  # pasada 147 asc: cubre el 100 % del perímetro EFFIS (la 52 solo el 54 %)
    },
    "rasuwa": {
        "title": "Colapso del Langtang Lirung y riada de Rasuwa (Nepal)",
        "region": "world",
        "kind": "landslide",
        "iso3": "NPL",
        "bbox": (85.25, 28.15, 85.58, 28.36),  # valle de Langtang + garganta Lende Khola / Trishuli
        "window": ("2026-06-01", "2026-11-14"),
        "event": "2026-08-26",  # colapso de roca y hielo (cara norte del Langtang Lirung) que represó el Lhende; EMS lo activó como GLOF (EMSR927)
        "pair": ("2026-08-19", "2026-08-31"),  # misma pasada 98 asc (40 MHz DHDH, 100 % cobertura)
        "track": 98,
        "s1_pair": ("2026-08-16", "2026-08-28"),  # Sentinel-1D pasada 85 asc: 2 días después del evento
        "s1_track": 85,
        "ems": {"code": "EMSR927", "date": "2026-08-26"},
    },
    # ---- Casos de interferometría (InSAR, NISAR L2 GUNW): pipeline/08_insar.py ----
    # mode "pairs": cada interferograma es un fotograma independiente (terremoto: varias geometrías)
    # mode "chain": pares consecutivos de 12 días de una pasada, sumados = desplazamiento acumulado
    "granada": {
        "title": "Serie sísmica de Granada (Santa Fe · Alhendín)",
        "kind": "earthquake",
        "bbox": (-3.90, 36.98, -3.36, 37.28),
        "window": ("2026-06-01", "2026-11-14"),
        "event": "2026-08-14",  # M5,2 a las 23:04 UTC (EMSC, 2 km de profundidad); M4,9 el 18 ago 08:37 UTC
        "insar": {
            "mode": "pairs",
            "pairs": [  # (pasada, antes, después): tres geometrías que abarcan los dos terremotos (la 15 solo cubre el 4 %)
                (87, "2026-07-26", "2026-08-19"),
                (95, "2026-07-26", "2026-08-19"),
                (167, "2026-07-19", "2026-08-24"),
            ],
            "hotspot": (-3.6316, 37.1147),  # epicentro M5,2 (EMSC)
            "res": 0.0005,
            "vmax_cm": 4.0,
            "fringe_cm": 2.0,
            "exclude_km": 12,  # radio sin usar para quitar rampa y atmósfera
        },
    },
    "venezuela": {
        "title": "Doblete sísmico de Venezuela (Yaracuy · La Guaira)",
        "region": "world",
        "kind": "earthquake",
        "iso3": "VEN",
        "seismic_source": "usgs",
        "bbox": (-68.90, 10.21, -66.75, 10.85),
        "window": ("2026-06-01", "2026-07-15"),
        "event": "2026-06-24",  # Mw 7,2 (22:04:31 UTC, San Felipe) y Mw 7,5 (22:05:03 UTC, Catia La Mar), 32 s después; prof. 10 km
        "insar": {
            "mode": "pairs",
            "pairs": [  # en orden cronológico (fecha posterior al sismo): así los lee la línea de tiempo de la web
                (162, "2026-06-13", "2026-06-25"),  # ascendente (+12 h tras el sismo): cubre ambos epicentros M7,2 y M7,5
                (54, "2026-06-17", "2026-06-29"),   # descendente: ruptura occidental y central (Yaracuy - Puerto Cabello - Aragua)
                (61, "2026-06-18", "2026-06-30"),   # ascendente: ruptura oriental (Catia La Mar - La Guaira - Caracas)
                (126, "2026-06-22", "2026-07-04"),  # descendente: ruptura central y oriental (Catia La Mar - La Guaira)
            ],
            "main_track": 162,  # mapa principal: la única pasada que cubre los dos epicentros
            # sin "peak": con la 61 (23 % válido) el percentil 0,5 daba −74 cm, más que los ~60 cm horizontales de JPL;
            # la comparación con JPL se hace por la proyección: 60 cm E-O se ven como ~33-42 cm en la línea de visión
            "hotspot": (-67.2109, 10.5500),   # zona costera epicentral M7,5 al oeste de Catia La Mar (cubierta por 61, 126 y 162)
            "hotspot2": (-68.2500, 10.5400),  # traza costera de la falla de Morón / M7,2 San Felipe (cubierta por 54 y 162)
            "disc_km": 1.2,
            "iono": True,
            "detrend": "x_dem",
            "excl_lat_min": 10.28,
            "res": 0.0012,
            "vmax_cm": 40.0,
            "fringe_cm": 11.9,
            "exclude_km": 32,
        },
        "official": {
            "url": "https://science.nasa.gov/earth/earth-observatory/where-venezuelas-earthquakes-shifted-the-ground/",
            "image": "https://assets.science.nasa.gov/content/dam/science/esd/eo/images/iotd/2026/where-venezuela’s-earthquakes-shifted-the-ground/venezuela_nisar_20260630.jpg",
            "credit": "NASA Earth Observatory/Lauren Dauphin; datos: Eric Fielding, equipo científico NISAR (JPL)",
            "date": "2026-07-10",
            "claim": "Hasta ~60 cm de desplazamiento hacia el oeste junto al aeropuerto de Maiquetía",
        },
    },
    "lorca": {
        "title": "Subsidencia del Alto Guadalentín (Lorca)",
        "kind": "subsidence",
        "bbox": (-1.86, 37.56, -1.42, 37.84),
        "window": ("2026-06-01", "2026-11-14"),
        "event": "2026-06-25",  # fenómeno continuo: inicio de la serie
        "insar": {"mode": "chain", "track": 159, "hotspot": (-1.608, 37.605), "res": 0.0005, "vmax_cm": 4.0, "fringe_cm": 2.0, "exclude_km": 11},  # máximo NISAR (la bibliografía lo sitúa ~4 km al SO de Lorca)
    },
    "lapalma": {
        "title": "Colada del Tajogaite (La Palma)",
        "kind": "volcano",
        "bbox": (-18.00, 28.56, -17.84, 28.68),
        "window": ("2026-06-01", "2026-11-14"),
        "event": "2021-09-19",  # inicio de la erupción; la colada sigue hundiéndose
        "insar": {"mode": "chain", "track": 131, "hotspot": (-17.895, 28.617), "res": 0.0003, "vmax_cm": 3.0, "fringe_cm": 2.0, "exclude_km": 3.5,
                  "context": {"osm_relation": 13249829, "ref_label": "Colada de 2021: © OpenStreetMap (relación 13249829)"}},
    },
    "alora": {
        "title": "Talud del AVE en Álora (Málaga)",
        "kind": "landslide",
        "bbox": (-4.76, 36.78, -4.58, 36.92),
        "window": ("2026-06-01", "2026-11-14"),
        "event": "2026-02-04",  # rotura del talud en el PK 121 (borrasca Leonardo)
        "insar": {"mode": "chain", "track": 95, "hotspot": (-4.70, 36.87), "res": 0.0003, "vmax_cm": 3.0, "fringe_cm": 1.5, "exclude_km": 2,
                  "context": {"rail": True},
                  "s1_pair": ("2026-02-03", "2026-02-09")},  # Sentinel-1 pasada 74 asc: la víspera y 5 días después de la rotura
    },
    # ---- NISAR en el mundo: eventos difundidos por NASA/JPL, procesados aquí con el mismo pipeline ----
    # "official": imagen de NASA/JPL para comparar (se muestra con su crédito; la nuestra es independiente)
    "cdmx": {
        "title": "Subsidencia de Ciudad de México",
        "region": "world",
        "iso3": "MEX",  # país para WorldPop (07_risk.py; por defecto ESP)
        "risk_places": "city|town|suburb",  # nombres de colonia/alcaldía para las celdas de mayor riesgo
        "kind": "subsidence",
        "bbox": (-99.25, 19.25, -98.85, 19.60),
        # 25 oct → 22 feb (10 pares): incluye el periodo del mapa de JPL (25 oct – 17 ene). Desde finales de febrero
        # la coherencia en Chalco cae (campos en temporada seca) y los pares sin dato aplanarían la serie
        "window": ("2025-10-20", "2026-02-21"),
        "event": "2025-10-25",  # fenómeno continuo: inicio de la serie NISAR
        "insar": {"mode": "chain", "track": 113, "res": 0.0005, "vmax_cm": 12.0, "fringe_cm": 5.0, "exclude_km": 8,
                  "hotspot": (-99.051, 19.269),  # Chalco: mínimo del cuenco suavizado (~3 km); JPL también lo destaca
                  "fit_above_m": 2280},  # rampa y relieve ajustados solo en los cerros; el lecho del antiguo lago (~2240 m) se hunde
        "official": {
            "url": "https://www.jpl.nasa.gov/images/pia26709-us-indian-spacecraft-captures-mexico-city-subsidence/",
            "image": "https://d2pn8kiwq2w21t.cloudfront.net/original_images/PIA26709.jpg",
            "credit": "NASA/JPL-Caltech/David Bekaert",
            "date": "2026-04-28",
            "claim": "Más de 2 cm/mes de hundimiento (25 oct 2025 – 17 ene 2026)",
        },
    },
    "krasheninnikov": {
        "title": "Volcán Krasheninnikov (Kamchatka)",
        "region": "world",
        "kind": "volcano",
        "change": "lava",  # cambio de retrodispersión (GCOV), no interferometría: la colada nueva es más brillante
        "bbox": (160.12, 54.52, 160.42, 54.67),
        "window": ("2026-06-01", "2026-11-15"),
        "event": "2025-08-03",  # primera erupción histórica (noche del 2 al 3 ago 2025), cuatro días después del M8,8 del 30 jul
        "pair": ("2026-07-13", "2026-09-23"),  # verano sin nieve (el 1 jul aún quedan neveros húmedos)
        "track": 80,
        "lava": {"crater": (160.290, 54.603), "radius_km": 7, "min_db": 2.5},
        "official": {
            "url": "https://svs.gsfc.nasa.gov/5675",
            "image": "https://svs.gsfc.nasa.gov/vis/a000000/a005600/a005675/nisar_volcano_annotated.00500_print.jpg",
            "credit": "NASA Scientific Visualization Studio: Alex Kekesi (ADNET); ciencia: Matthew Pritchard (Cornell), Paul A. Rosen y Marco Lavalle (JPL)",
            "date": "2026-09-24",
            "claim": "Timelapse de 17 imágenes NISAR (25 dic 2025 – ago 2026): la lava llena la caldera interior y se abre en abanico hacia el este",
        },
    },
    "mozambique": {
        "title": "Inundaciones del Limpopo (Mozambique)",
        "region": "world",
        "iso3": "MOZ",
        "kind": "flood",
        "bbox": (32.75, -25.10, 33.30, -24.40),  # Chókwè, Guijá y el bajo Limpopo
        "window": ("2025-12-01", "2026-02-15"),
        "event": "2026-01-15",
        "pair": ("2026-01-05", "2026-01-17"),
        "track": 114,
        "water_db": -14.0,  # valle del histograma HH del 17 ene (agua ~−18 dB, tierra mojada ~−6 dB); Otsu daba −11,5
        "official": {
            "url": "https://svs.gsfc.nasa.gov/5661",
            "image": "https://svs.gsfc.nasa.gov/vis/a000000/a005600/a005661/Post_Chokwe.png",
            "credit": "NASA SVS: Zoey N. Armstrong (Navteca); Alexandra Christensen y Bruce Chapman (JPL); Andrew Wang (JPL)",
            "date": "2026-08-06",
            "claim": "Más de 600 000 desplazados; el radar ve el agua bajo las nubes que tapaban a Sentinel-2",
        },
    },
    "langtang": {
        "title": "Colapso del glaciar del Langtang Lirung (Nepal)",
        "region": "world",
        "kind": "landslide",
        # origen de la riada de Rasuwa: avalancha de roca y hielo en la cara norte (5200–5400 m), 26 ago 2026 02:52 UTC
        "bbox": (85.40, 28.18, 85.65, 28.36),
        "window": ("2026-06-01", "2026-08-20"),  # solo ANTES del colapso: ¿se movía la ladera?
        "event": "2026-08-26",
        # el punto de rotura (85,525, 28,285) es hielo sin coherencia: fuera de las componentes conexas del GUNW.
        # Serie en el punto que más se mueve a menos de 2 km (ladera a 1,7 km al O, 3860 m); la mediana en 2 km es +0,3 cm
        "insar": {"mode": "chain", "track": 98, "hotspot": (85.5083, 28.2897), "res": 0.0005,
                  "vmax_cm": 15.0, "fringe_cm": 5.0, "exclude_km": 3,
                  "until": "2026-08-19"},  # el par 19→31 ago ya cruza el colapso: fuera
        "official": None,  # sin imagen NASA; comparación con ICIMOD (hasta 30 cm, 26 jul – 19 ago) y Remote Sensing (MDPI, 2026)
    },
}


# --- Credenciales NASA Earthdata (solo desde el .env del proyecto, nada global) ---
ENV_FILE = ROOT / ".env"


def load_env() -> None:
    """Carga las variables del archivo .env del proyecto en el entorno del proceso."""
    import os
    if not ENV_FILE.exists():
        return
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, val = line.split("=", 1)
        os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))


def earthdata_login():
    """Inicia sesión en Earthdata con EARTHDATA_TOKEN o EARTHDATA_USERNAME/PASSWORD del .env."""
    import os
    import earthaccess
    load_env()
    if not (os.environ.get("EARTHDATA_TOKEN") or
            (os.environ.get("EARTHDATA_USERNAME") and os.environ.get("EARTHDATA_PASSWORD"))):
        raise SystemExit(f"Faltan credenciales: copia .env.example a .env y rellénalo ({ENV_FILE})")
    auth = earthaccess.login(strategy="environment")
    if not auth or not auth.authenticated:
        raise SystemExit("Earthdata rechazó las credenciales del .env")
    return auth
