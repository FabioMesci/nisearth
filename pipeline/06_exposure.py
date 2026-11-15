"""Paso 6: exposición — qué había debajo de la máscara de radar.

- Cobertura del suelo: ESA WorldCover 2021 (10 m). Se lee solo el recorte del COG público en AWS.
- Población: WorldPop 2020 España (100 m, 'constrained'). Descarga única de ~44 MB a data/raw/pop/.

En incendios se separa:
  · zona quemada confirmada (radar ∩ EFFIS) → hectáreas por tipo de vegetación,
  · detecciones fuera de EFFIS → qué cubierta tenían (casi todo cultivo: cosechas, no fuego).
Y la población que vive a menos de 1 km del borde quemado (interfaz urbano-forestal).

Entrada: data/work/<caso>/mask.tif, data/raw/effis/<caso>_window.geojson
Salida:  manifest.json → landcover, exposure + métrica de población

Uso: python pipeline/06_exposure.py niebla
"""
import argparse
import json
import urllib.request

import geopandas as gpd
import numpy as np
import rasterio
from rasterio.features import rasterize
from rasterio.warp import Resampling, reproject
from rasterio.windows import from_bounds
from scipy.ndimage import binary_dilation

from config import CASES, RAW, WEB_DATA, WORK

WC_URL = "https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_{tile}_Map.tif"
POP_URL_TPL = "https://data.worldpop.org/GIS/Population/Global_2000_2020_Constrained/2020/BSGM/{iso3}/{iso_lo}_ppp_2020_constrained.tif"
WC_CLASSES = {10: "tree", 20: "shrub", 30: "grass", 40: "crop", 50: "built", 60: "bare", 70: "bare", 80: "water", 90: "wetland", 100: "grass"}


def wc_tile(lon, lat):
    """Nombre de la tesela WorldCover de 3°x3° que contiene el punto."""
    la, lo = int(np.floor(lat / 3) * 3), int(np.floor(lon / 3) * 3)
    return f"{'N' if la >= 0 else 'S'}{abs(la):02d}{'E' if lo >= 0 else 'W'}{abs(lo):03d}"


def worldcover(shape, transform, crs, bbox):
    tiles = {wc_tile(lon, lat) for lon in (bbox[0], bbox[2]) for lat in (bbox[1], bbox[3])}
    out = np.zeros(shape, np.uint8)
    for tile in sorted(tiles):  # el bbox puede cruzar teselas (La Safor cruza el meridiano 0)
        part = np.zeros(shape, np.uint8)
        with rasterio.open(WC_URL.format(tile=tile)) as src:
            reproject(rasterio.band(src, 1), part, dst_transform=transform, dst_crs=crs,
                      dst_nodata=0, resampling=Resampling.mode)
        out = np.where(out == 0, part, out)
    print(f"[wc] WorldCover leído ({', '.join(sorted(tiles))})")
    return out


def pixel_ha(transform, lat):
    dx, dy = abs(transform.a), abs(transform.e)
    return (dx * 111320 * np.cos(np.radians(lat))) * (dy * 110570) / 1e4


def breakdown(wc, sel, pxha):
    vals, counts = np.unique(wc[sel], return_counts=True)
    tot = counts.sum() or 1
    rows = [{"cls": WC_CLASSES.get(int(v), "other"), "ha": round(float(c * pxha)), "pct": round(float(100 * c / tot), 1)}
            for v, c in zip(vals, counts)]
    # agrupar 'other' y ordenar de mayor a menor
    merged = {}
    for r in rows:
        m = merged.setdefault(r["cls"], {"cls": r["cls"], "ha": 0, "pct": 0.0})
        m["ha"] += r["ha"]
        m["pct"] = round(m["pct"] + r["pct"], 1)
    return sorted(merged.values(), key=lambda r: -r["ha"])


def population(sel, transform, crs, bbox, iso3="ESP"):
    """Personas dentro de 'sel': se lleva la fracción de máscara a la rejilla de 100 m de WorldPop."""
    iso_lo = iso3.lower()
    pop_file = RAW / "pop" / f"{iso_lo}_ppp_2020_constrained.tif"
    if not pop_file.exists():
        pop_file.parent.mkdir(parents=True, exist_ok=True)
        pop_url = POP_URL_TPL.format(iso3=iso3.upper(), iso_lo=iso_lo)
        print(f"[pop] descargando WorldPop {iso3}…")
        urllib.request.urlretrieve(pop_url, pop_file)
    with rasterio.open(pop_file) as src:
        win = from_bounds(*bbox, transform=src.transform).round_offsets().round_lengths()
        pop = src.read(1, window=win).astype("float64")
        ptr = src.window_transform(win)
        pop[pop == src.nodata] = 0
    frac = np.zeros(pop.shape, "float64")
    reproject(sel.astype("float32"), frac, src_transform=transform, src_crs=crs,
              dst_transform=ptr, dst_crs="EPSG:4326", resampling=Resampling.average)
    return float((pop * frac).sum())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("case", choices=CASES)
    args = ap.parse_args()
    cid, case = args.case, CASES[args.case]
    bbox = case["bbox"]
    iso3 = case.get("iso3", "ESP")

    with rasterio.open(WORK / cid / "mask.tif") as ds:
        mask = ds.read(1).astype(bool)
        tr, crs = ds.transform, ds.crs
    lat = (bbox[1] + bbox[3]) / 2
    pxha = pixel_ha(tr, lat)
    wc = worldcover(mask.shape, tr, crs, bbox)

    mpath = WEB_DATA / cid / "manifest.json"
    man = json.loads(mpath.read_text())
    metrics = []

    if case["kind"] == "fire":
        effis = gpd.read_file(RAW / "effis" / f"{cid}_window.geojson").to_crs(4326)
        ef = rasterize([(g, 1) for g in effis.geometry], out_shape=mask.shape, transform=tr).astype(bool)
        confirmed, outside = mask & ef, mask & ~ef
        lc = breakdown(wc, confirmed, pxha)
        lc_out = breakdown(wc, outside, pxha)
        # interfaz urbano-forestal: 1 km alrededor de la zona quemada confirmada
        px_m = abs(tr.a) * 111320 * np.cos(np.radians(lat))
        ring = binary_dilation(confirmed, iterations=int(round(1000 / px_m))) & ~confirmed
        p_in = population(confirmed, tr, crs, bbox, iso3)
        p_ring = population(ring, tr, crs, bbox, iso3)
        print(f"[lc] quemado confirmado: {lc}")
        print(f"[lc] fuera de EFFIS: {lc_out}")
        print(f"[pop] dentro {p_in:.0f} · a <1 km {p_ring:.0f}")
        veg = sum(r["ha"] for r in lc if r["cls"] in ("tree", "shrub", "grass"))
        man["landcover"] = {"source": "ESA WorldCover 2021 (10 m)", "inside": lc, "outside_ref": lc_out}
        man["exposure"] = {"source": "WorldPop 2020 (100 m)", "pop_inside": round(p_in), "pop_1km": round(p_ring)}
        metrics = [
            {"id": "forest", "label": "Bosque y matorral quemados (confirmado)", "value": veg, "unit": "ha"},
            {"id": "pop1km", "label": "Personas a menos de 1 km del borde quemado", "value": round(p_ring, -1), "unit": "hab."},
        ]
    elif case["kind"] == "landslide":
        px_m = abs(tr.a) * 111320 * np.cos(np.radians(lat))
        sel = binary_dilation(mask, iterations=1)
        ring = binary_dilation(mask, iterations=int(round(1000 / px_m))) & ~mask
        lc = breakdown(wc, mask, pxha)
        p_in = population(sel, tr, crs, bbox, iso3)
        p_ring = population(ring, tr, crs, bbox, iso3)
        print(f"[lc] superficie deslizada / GLOF: {lc}")
        print(f"[pop] en cauce/lengua {p_in:.0f} · a <1 km del corredor {p_ring:.0f}")
        man["landcover"] = {"source": "ESA WorldCover 2021 (10 m)", "inside": lc}
        man["exposure"] = {"source": "WorldPop 2020 (100 m)", "pop_inside": round(p_in), "pop_1km": round(p_ring)}
        metrics = [
            {"id": "pop", "label": "Personas en el corredor afectado (<1 km)", "value": round(p_in + p_ring), "unit": "hab."},
        ]
    else:
        # inundación: incluimos 1 px de margen, como en 04_context (bordes de agua)
        sel = binary_dilation(mask, iterations=1)
        lc = breakdown(wc, mask, pxha)
        p_in = population(sel, tr, crs, bbox, iso3)
        print(f"[lc] agua nueva: {lc}")
        print(f"[pop] en zona inundada {p_in:.0f}")
        man["landcover"] = {"source": "ESA WorldCover 2021 (10 m)", "inside": lc}
        man["exposure"] = {"source": "WorldPop 2020 (100 m)", "pop_inside": round(p_in)}
        metrics = [{"id": "pop", "label": "Personas en zona con agua nueva", "value": round(p_in), "unit": "hab."}]

    ids = {m["id"] for m in metrics}
    man["metrics"] = [m for m in man["metrics"] if m["id"] not in ids] + metrics
    mpath.write_text(json.dumps(man, indent=1, ensure_ascii=False))
    print(f"[ok] exposición añadida a {mpath}")


if __name__ == "__main__":
    main()
