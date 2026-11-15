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
        "title": "Derrumbe y GLOF de Rasuwa — Langtang (Nepal)",
        "kind": "landslide",
        "iso3": "NPL",
        "bbox": (85.25, 28.15, 85.58, 28.36),  # valle de Langtang + garganta Lende Khola / Trishuli
        "window": ("2026-06-01", "2026-11-14"),
        "event": "2026-08-26",  # avalancha de roca/hielo en Langtang + GLOF (Copernicus EMSR927)
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
        "kind": "earthquake",
        "iso3": "VEN",
        "seismic_source": "usgs",
        "bbox": (-68.90, 10.21, -66.75, 10.85),
        "window": ("2026-06-01", "2026-07-15"),
        "event": "2026-06-24",  # Mw 7,2 (22:04:31 UTC, San Felipe) y Mw 7,5 (22:05:03 UTC, Catia La Mar), prof. 10 km
        "insar": {
            "mode": "pairs",
            "pairs": [
                (54, "2026-06-17", "2026-06-29"),   # descendente: ruptura occidental y central (Yaracuy - Puerto Cabello - Aragua)
                (61, "2026-06-18", "2026-06-30"),   # ascendente: ruptura oriental (Catia La Mar - La Guaira - Caracas)
                (126, "2026-06-22", "2026-07-04"),  # descendente: ruptura central y oriental (Catia La Mar - La Guaira)
                (162, "2026-06-13", "2026-06-25"),  # ascendente (+12 h tras el sismo): cubre ambos epicentros M7,2 y M7,5
            ],
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
