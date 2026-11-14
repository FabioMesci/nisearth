"""Paso 4: cruzar la máscara de radar con datos de contexto (infraestructuras).

- Inundación: km de vía férrea y de carreteras principales dentro del agua nueva (OpenStreetMap).
  Exporta los tramos afectados como GeoJSON para dibujarlos en rojo en la web.
- Incendio: km de carreteras y vías dentro de la zona quemada (infraestructura aguas abajo en riesgo).

Entrada: data/work/<caso>/mask.tif (de 03_process.py)
Salida:  web/public/data/<caso>/rail_affected.geojson, roads_affected.geojson + métricas en manifest.json

Uso: python pipeline/04_context.py dana
"""
import argparse
import json
import time

import geopandas as gpd
import numpy as np
import osmnx as ox
import rasterio
from rasterio.features import rasterize, shapes
from scipy.ndimage import binary_dilation
from shapely.geometry import box, shape
from shapely.ops import unary_union

from config import CASES, RAW, WEB_DATA, WORK

ox.settings.use_cache = True
ox.settings.cache_folder = str(WORK / "osm_cache")
ox.settings.log_console = False


def mask_polygons(path, buffer_px=1):
    """Vectoriza la máscara (con un pequeño margen: las vías suelen ir en terraplén junto al agua)."""
    with rasterio.open(path) as ds:
        m = ds.read(1).astype(bool)
        if buffer_px:
            m = binary_dilation(m, iterations=buffer_px)
        polys = [shape(g) for g, v in shapes(m.astype("uint8"), mask=m, transform=ds.transform) if v == 1]
    return unary_union(polys) if polys else None


def osm_lines(bbox, tags, tries=5):
    lon0, lat0, lon1, lat1 = bbox
    for i in range(tries):
        try:
            gdf = ox.features_from_bbox((lon0, lat0, lon1, lat1), tags)
            break
        except ox._errors.InsufficientResponseError:
            print(f"   OSM: no hay elementos {tags} en el bbox")
            return gpd.GeoDataFrame(geometry=[], crs=4326)
        except Exception as e:  # Overpass saturado (429/504): esperar y reintentar
            wait = 10 * 2**i
            print(f"   OSM ocupado ({type(e).__name__}); reintento en {wait}s")
            time.sleep(wait)
    else:
        raise SystemExit("Overpass no responde; vuelve a intentarlo en unos minutos")
    gdf = gdf[gdf.geometry.type.isin(["LineString", "MultiLineString"])]
    return gdf[["geometry"] + [c for c in ("name", "railway", "highway", "ref") if c in gdf.columns]].reset_index(drop=True)


def km(gdf):
    if gdf.empty:
        return 0.0
    return float(gdf.to_crs(gdf.estimate_utm_crs()).length.sum() / 1000)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("case", choices=CASES)
    args = ap.parse_args()
    cid, case = args.case, CASES[args.case]

    area = mask_polygons(WORK / cid / "mask.tif")
    if area is None:
        raise SystemExit("La máscara está vacía")
    effis = None
    if case["kind"] == "fire" and (RAW / "effis" / f"{cid}_window.geojson").exists():
        # En incendios solo contamos la zona quemada CONFIRMADA (radar ∩ EFFIS):
        # los cambios agrícolas fuera del perímetro darían falsos positivos.
        effis = gpd.read_file(RAW / "effis" / f"{cid}_window.geojson").to_crs(4326)
        area = area.intersection(effis.union_all())
    area_gdf = gpd.GeoDataFrame(geometry=[area], crs=4326)

    rail = osm_lines(case["bbox"], {"railway": ["rail", "light_rail", "narrow_gauge"]})
    roads = osm_lines(case["bbox"], {"highway": ["motorway", "trunk", "primary", "secondary", "tertiary"]})
    print(f"[osm] {len(rail)} vías, {len(roads)} carreteras en el bbox")

    rail_hit = gpd.clip(rail, area_gdf) if not rail.empty else rail
    roads_hit = gpd.clip(roads, area_gdf) if not roads.empty else roads
    out = WEB_DATA / cid
    overlays = {}
    for name, g in (("rail", rail_hit), ("roads", roads_hit)):
        g = g[~g.geometry.is_empty]
        g.to_file(out / f"{name}_affected.geojson", driver="GeoJSON")
        overlays[name] = f"{name}_affected.geojson"

    rail_km, roads_km = round(km(rail_hit), 1), round(km(roads_hit), 1)
    rail_dist_km = None
    if case["kind"] == "fire" and not rail.empty:
        utm = rail.estimate_utm_crs()
        rail_dist_km = round(float(rail.to_crs(utm).distance(area_gdf.to_crs(utm).geometry[0]).min()) / 1000, 1)
        print(f"[dist] vía férrea más cercana a la zona quemada: {rail_dist_km} km")
    names = sorted({n for n in rail_hit.get("name", []) if isinstance(n, str)})[:3]
    print(f"[hit] vía férrea {rail_km} km {names}  ·  carreteras {roads_km} km")

    mpath = out / "manifest.json"
    man = json.loads(mpath.read_text())

    if case["kind"] == "fire":
        effis_path = RAW / "effis" / f"{cid}_window.geojson"
        if effis_path.exists():
            effis = gpd.read_file(effis_path).to_crs(4326)
            effis.to_file(out / "effis.geojson", driver="GeoJSON")
            overlays["effis"] = "effis.geojson"
            with rasterio.open(WORK / cid / "mask.tif") as ds:
                m = ds.read(1).astype(bool)
                ef = rasterize([(g, 1) for g in effis.geometry], out_shape=m.shape, transform=ds.transform).astype(bool)
            recall = 100 * (m & ef).sum() / ef.sum()
            precision = 100 * (m & ef).sum() / max(m.sum(), 1)
            print(f"[effis] recall {recall:.0f}%  precisión {precision:.0f}%")
            man.setdefault("stats", {}).update({"effis_recall": round(recall), "effis_precision": round(precision)})
            man["metrics"] = [x for x in man["metrics"] if x["id"] != "effis"] + [
                {"id": "effis", "label": "De lo detectado, dentro del perímetro EFFIS", "value": round(precision), "unit": "%"}]
    if case["kind"] == "flood" and case.get("ems"):
        # Copernicus EMS Rapid Mapping (óptico, el día después del pico): ¿cuánto de esa agua seguía al pasar NISAR?
        import pandas as pd
        ems = pd.concat([gpd.read_file(f) for f in sorted((RAW / "ems").glob("aoi0*/*observedEventA*.json"))]).to_crs(4326)
        ems = ems[ems["notation"] == "Flooded area"][["notation", "geometry"]]
        ems.to_file(out / "ems.geojson", driver="GeoJSON")
        overlays["ems"] = "ems.geojson"
        with rasterio.open(WORK / cid / "mask.tif") as ds:
            m = ds.read(1).astype(bool)
            e = rasterize([(g, 1) for g in ems.geometry], out_shape=m.shape, transform=ds.transform).astype(bool)
            lat = (case["bbox"][1] + case["bbox"][3]) / 2
            pxha = (abs(ds.transform.a) * 111320 * np.cos(np.radians(lat))) * (abs(ds.transform.e) * 110570) / 1e4
        seen = 100 * (m & e).sum() / max(e.sum(), 1)
        print(f"[ems] {case['ems']['code']}: {e.sum() * pxha:.0f} ha inundadas el {case['ems']['date']}; NISAR ve {seen:.1f} %")
        man.setdefault("stats", {}).update({"ems_code": case["ems"]["code"], "ems_date": case["ems"]["date"],
                                            "ems_ha": round(float(e.sum() * pxha)), "ems_seen_pct": round(float(seen), 1),
                                            "nisar_in_ems_pct": round(float(100 * (m & e).sum() / max(m.sum(), 1)), 1)})
        man["metrics"] = [x for x in man["metrics"] if x["id"] != "ems_seen"] + [
            {"id": "ems_seen", "label": "De la inundación vista por Copernicus EMS, aún visible para NISAR", "value": round(float(seen)), "unit": "%"}]
    lab = "en zona inundada" if case["kind"] == "flood" else "en zona quemada confirmada"
    new = [
        {"id": "rail", "label": f"Vía férrea {lab}", "value": rail_km, "unit": "km"},
        {"id": "roads", "label": f"Carreteras {lab}", "value": roads_km, "unit": "km"},
    ]
    if rail_dist_km is not None and rail_km == 0:
        new[0] = {"id": "rail", "label": "Distancia de la vía férrea a la zona quemada", "value": rail_dist_km, "unit": "km"}
    ids = {m["id"] for m in new}
    man["metrics"] = [m for m in man["metrics"] if m["id"] not in ids] + new
    man["overlays"] = {**man.get("overlays", {}), **overlays}
    man.setdefault("stats", {})["rail_lines"] = names
    mpath.write_text(json.dumps(man, indent=1, ensure_ascii=False))
    print(f"[ok] contexto añadido a {mpath}")


if __name__ == "__main__":
    main()
