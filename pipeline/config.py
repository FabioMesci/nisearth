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
    },
    "niebla": {
        "title": "Incendio de Niebla (Huelva)",
        "kind": "fire",
        "bbox": (-6.80, 37.36, -6.20, 37.68),  # perímetro EFFIS (id 606000) + margen
        "window": ("2026-06-01", "2026-11-14"),
        "event": "2026-08-06",  # inicio; estabilizado ~15 ago
        "pair": ("2026-07-21", "2026-08-26"),
        "track": 23,
        "s1_pair": ("2026-07-21", "2026-08-26"),  # Sentinel-1 pasada 52 desc: mismas fechas que NISAR
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
