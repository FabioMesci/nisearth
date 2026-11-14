"""Step 7: risk index on a ~500 m grid.  Risk = Hazard x Exposure x Vulnerability.

Every factor is a 0-1 index per grid cell, built only from open data:

  HAZARD        radar mask (NISAR) fused with the official reference (EFFIS perimeter for fires,
                Copernicus EMS flood extent for floods), fire intensity from NASA FIRMS radiative
                power, and a distance-decay zone around the footprint.
  EXPOSURE      population (WorldPop 100 m), built-up share (ESA WorldCover), road and rail length
                and critical facilities (OpenStreetMap), land assets (forest or cropland).
  VULNERABILITY physical susceptibility of each land cover to the hazard, share of dependent-age
                population (under 5 and 65+, WorldPop age structure), and lack of coping capacity
                (distance to the nearest hospital and fire station, OpenStreetMap).

The three factors are combined INFORM-style (JRC): risk = (H * E * V) ** (1/3), so a cell with no
hazard, nobody and nothing exposed, or no vulnerability scores zero.

A cascade screening indicator is added (Copernicus DEM slope): burned steep slopes for fires
(post-fire runoff and erosion), rain-loaded steep slopes for floods (slope failure onto infrastructure).

A Monte Carlo run perturbs every weight by +/-25 % to report how stable each cell's class is.

Input:  data/work/<case>/mask.tif (falls back to web/public/data/<case>/mask.png), the reference
        GeoJSON already published by 04_context.py / 05_external.py, and remote open data.
Output: web/public/data/<case>/risk.geojson, risk.csv and manifest.json -> risk, overlays.risk

Usage: python pipeline/07_risk.py niebla
"""
import argparse
import csv
import datetime as dt
import json
import time
import urllib.request
from pathlib import Path

import numpy as np
import rasterio
import requests
from rasterio.features import rasterize
from rasterio.transform import from_bounds
from rasterio.warp import Resampling, reproject
from rasterio.windows import from_bounds as window_from_bounds
from scipy.ndimage import distance_transform_edt

from config import CASES, RAW, WEB_DATA, WORK

# --------------------------------------------------------------------------- parameters
CELL_DEG = 0.005  # grid cell (~440 m x 555 m at 38 N)
CLASS_EDGES = [0.20, 0.35, 0.50, 0.65]
CLASS_NAMES = ["very_low", "low", "medium", "high", "very_high"]
MIN_HAZARD = 0.02  # cells below this hazard are not exported

HAZARD = {
    "fire": {
        "w_ref_only": 0.7,     # inside the EFFIS perimeter but not detected by radar
        "w_radar_only": 0.5,   # radar detection on natural vegetation outside EFFIS
        "edge_m": 1000,        # wildland-urban interface: embers, smoke, evacuation
        "w_edge": 0.25,
        "intensity_floor": 0.6,  # hazard multiplier where FIRMS saw no hotspot
    },
    "flood": {
        "w_ref_only": 1.0,     # Copernicus EMS mapped water the radar no longer saw
        "w_radar_only": 1.0,
        "edge_m": 250,         # extent uncertainty: the flood peak was not observed
        "w_edge": 0.25,
        "intensity_floor": 1.0,
    },
}
EXPOSURE_W = {"population": 0.40, "built": 0.15, "infrastructure": 0.15, "critical": 0.15, "land": 0.15}
VULNERABILITY_W = {"physical": 0.40, "social": 0.30, "coping": 0.30}
POP_DENSITY_REF = 5000   # persons / km2 -> exposure 1
BUILT_REF = 0.5          # built-up share -> exposure 1
INFRA_REF_KM = 1.5       # weighted km of network per cell -> exposure 1 (rail counts double)
AGE_DEP_REF = 0.5        # dependent-age share -> social vulnerability 1
HOSPITAL_REF_KM = 30
FIRE_STATION_REF_KM = 20
SLOPE_REF_DEG = 25       # slope at which the cascade factor saturates
STEEP_DEG = 15
RAIN_REF_MM = 200        # event rainfall at which the flood cascade trigger saturates
MC_RUNS = 300
MC_SPREAD = 0.25

# Physical susceptibility of each land-cover class to the hazard (0 = unaffected, 1 = destroyed).
SUSCEPTIBILITY = {
    "fire": {"tree": 0.9, "shrub": 1.0, "grass": 0.7, "crop": 0.4, "built": 0.6, "bare": 0.05, "water": 0.0, "wetland": 0.2},
    "flood": {"tree": 0.3, "shrub": 0.3, "grass": 0.3, "crop": 0.7, "built": 0.9, "bare": 0.2, "water": 0.0, "wetland": 0.1},
}
LAND_ASSET = {"fire": ("tree", "shrub"), "flood": ("crop",)}

WC_URL = "https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_{tile}_Map.tif"
WC_CLASSES = {10: "tree", 20: "shrub", 30: "grass", 40: "crop", 50: "built", 60: "bare", 80: "water", 90: "wetland"}
POP_URL = "https://data.worldpop.org/GIS/Population/Global_2000_2020_Constrained/2020/BSGM/ESP/esp_ppp_2020_constrained.tif"
POP1K_URL = "https://data.worldpop.org/GIS/Population/Global_2000_2020_1km/2020/ESP/esp_ppp_2020_1km_Aggregated.tif"
AGE_URL = "https://data.worldpop.org/GIS/AgeSex_structures/Global_2000_2020_1km/unconstrained/2020/ESP/esp_{sex}_{age}_2020_1km.tif"
DEPENDENT_AGES = (0, 1, 65, 70, 75, 80)  # WorldPop 5-year groups: under 5 and 65+
DEM_URL = "https://copernicus-dem-30m.s3.amazonaws.com/{name}/{name}.tif"
OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"]

SOURCES = [
    "NISAR L2 GCOV change mask (this pipeline)",
    "EFFIS burnt-area perimeters / Copernicus EMS Rapid Mapping",
    "NASA FIRMS VIIRS 375 m fire radiative power",
    "WorldPop 2020 population (100 m) and age structure (1 km)",
    "ESA WorldCover 2021 (10 m)",
    "OpenStreetMap roads, railways, hospitals, schools, fire stations (ODbL)",
    "Copernicus DEM GLO-30",
]


# --------------------------------------------------------------------------- helpers
def fetch(url: str, path: Path) -> Path:
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        print(f"[get] {url.rsplit('/', 1)[-1]}")
        urllib.request.urlretrieve(url, path)
    return path


def to_grid(src, src_tr, shape, dst_tr, how, src_nodata=None):
    """Resample an EPSG:4326 array onto another EPSG:4326 grid."""
    out = np.zeros(shape, "float64")
    reproject(src.astype("float64"), out, src_transform=src_tr, src_crs="EPSG:4326", dst_transform=dst_tr,
              dst_crs="EPSG:4326", resampling=how, src_nodata=src_nodata, dst_nodata=0)
    return out


def read_window(path, bbox, pad=0.0):
    """Read the bbox window of a local raster; nodata and negatives become 0."""
    x0, y0, x1, y1 = bbox
    with rasterio.open(path) as src:
        win = window_from_bounds(x0 - pad, y0 - pad, x1 + pad, y1 + pad, transform=src.transform).round_offsets().round_lengths()
        arr = src.read(1, window=win, boundless=True, fill_value=0).astype("float64")
        tr = src.window_transform(win)
        if src.nodata is not None:
            arr[arr == src.nodata] = 0
    arr[~np.isfinite(arr) | (arr < 0)] = 0
    return arr, tr


def load_mask(cid, bbox):
    tif = WORK / cid / "mask.tif"
    if tif.exists():
        with rasterio.open(tif) as ds:
            return ds.read(1).astype(bool), ds.transform
    from PIL import Image
    alpha = np.asarray(Image.open(WEB_DATA / cid / "mask.png").convert("RGBA"))[..., 3]
    print("[mask] data/work not found: using the published mask.png")
    return alpha > 0, from_bounds(*bbox, alpha.shape[1], alpha.shape[0])


def load_geojson(path):
    return json.loads(path.read_text(encoding="utf-8"))["features"] if path.exists() else []


def worldcover(shape, tr, bbox, cache):
    if cache.exists():
        return np.load(cache)["wc"]
    def tile(lon, lat):
        la, lo = int(np.floor(lat / 3) * 3), int(np.floor(lon / 3) * 3)
        return f"{'N' if la >= 0 else 'S'}{abs(la):02d}{'E' if lo >= 0 else 'W'}{abs(lo):03d}"
    out = np.zeros(shape, np.uint8)
    for t in sorted({tile(lon, lat) for lon in (bbox[0], bbox[2]) for lat in (bbox[1], bbox[3])}):
        part = np.zeros(shape, np.uint8)
        with rasterio.open(WC_URL.format(tile=t)) as src:
            reproject(rasterio.band(src, 1), part, dst_transform=tr, dst_crs="EPSG:4326", dst_nodata=0, resampling=Resampling.mode)
        out = np.where(out == 0, part, out)
        print(f"[wc] WorldCover tile {t}")
    cache.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(cache, wc=out)
    return out


def slope_deg(shape, tr, bbox, cache):
    """Slope in degrees on the fine grid from Copernicus DEM GLO-30 (read over HTTP, window only)."""
    if cache.exists():
        return np.load(cache)["slope"]
    dem = np.full(shape, np.nan, "float32")
    for lat in range(int(np.floor(bbox[1])), int(np.floor(bbox[3])) + 1):
        for lon in range(int(np.floor(bbox[0])), int(np.floor(bbox[2])) + 1):
            name = f"Copernicus_DSM_COG_10_{'N' if lat >= 0 else 'S'}{abs(lat):02d}_00_{'E' if lon >= 0 else 'W'}{abs(lon):03d}_00_DEM"
            part = np.full(shape, np.nan, "float32")
            try:
                with rasterio.open(DEM_URL.format(name=name)) as src:
                    reproject(rasterio.band(src, 1), part, dst_transform=tr, dst_crs="EPSG:4326", dst_nodata=np.nan, resampling=Resampling.bilinear)
            except rasterio.errors.RasterioIOError:
                continue  # sea-only tiles do not exist
            dem = np.where(np.isnan(dem), part, dem)
            print(f"[dem] {name}")
    dem = np.nan_to_num(dem, nan=0.0)
    lat = (bbox[1] + bbox[3]) / 2
    dy, dx = abs(tr.e) * 110570, abs(tr.a) * 111320 * np.cos(np.radians(lat))
    gy, gx = np.gradient(dem, dy, dx)
    slope = np.degrees(np.arctan(np.hypot(gx, gy))).astype("float32")
    np.savez_compressed(cache, slope=slope)
    return slope


def overpass(bbox, cache):
    """Roads and railways in the bbox; facilities and settlements in a padded bbox."""
    if cache.exists():
        return json.loads(cache.read_text(encoding="utf-8"))
    x0, y0, x1, y1 = bbox
    inner = f"({y0},{x0},{y1},{x1})"
    pad = 0.35
    outer = f"({y0 - pad},{x0 - pad},{y1 + pad},{x1 + pad})"
    query = f"""[out:json][timeout:120];
(way["highway"~"^(motorway|trunk|primary|secondary|tertiary)$"]{inner};
 way["railway"~"^(rail|light_rail|narrow_gauge)$"]{inner};);
out geom tags;
(nwr["amenity"~"^(hospital|fire_station)$"]{outer};
 nwr["amenity"~"^(school|kindergarten|clinic|nursing_home|police)$"]{inner};
 nwr["social_facility"="nursing_home"]{inner};
 node["place"~"^(city|town|village)$"]{outer};);
out center tags;"""
    for i in range(6):
        try:
            r = requests.post(OVERPASS[i % 2], data={"data": query}, timeout=180, headers={"User-Agent": "sar-risk-pipeline/0.1"})
            r.raise_for_status()
            data = r.json()
            break
        except Exception as e:  # Overpass busy (429/504): wait and retry
            print(f"   Overpass busy ({type(e).__name__}); retry in {10 * (i + 1)} s")
            time.sleep(10 * (i + 1))
    else:
        raise SystemExit("Overpass is not answering; try again in a few minutes")
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(json.dumps(data), encoding="utf-8")
    return data


def line_km(ways, shape, tr, lat0):
    """Length of the given OSM ways per grid cell (km), sampling each segment every ~20 m."""
    out = np.zeros(shape)
    kx, ky = 111.320 * np.cos(np.radians(lat0)), 110.570
    for w in ways:
        g = w.get("geometry") or []
        if len(g) < 2:
            continue
        lon = np.array([p["lon"] for p in g])
        lat = np.array([p["lat"] for p in g])
        seg = np.hypot(np.diff(lon) * kx, np.diff(lat) * ky)
        n = np.maximum(1, np.ceil(seg / 0.02).astype(int))
        idx = np.repeat(np.arange(len(seg)), n)
        frac = (np.concatenate([np.arange(k) for k in n]) + 0.5) / n[idx]
        px, py = lon[idx] + frac * np.diff(lon)[idx], lat[idx] + frac * np.diff(lat)[idx]
        col, row = ((px - tr.c) / tr.a).astype(int), ((py - tr.f) / tr.e).astype(int)
        ok = (col >= 0) & (col < shape[1]) & (row >= 0) & (row < shape[0])
        np.add.at(out, (row[ok], col[ok]), (seg[idx] / n[idx])[ok])
    return out


def pt(el):
    c = el.get("center") or el
    return c.get("lon"), c.get("lat")


def nearest_km(lon, lat, pts, lat0):
    """Distance (km) and index of the nearest point for every cell centre."""
    if not pts:
        return np.full(lon.shape, np.nan), np.zeros(lon.shape, int)
    p = np.array(pts)
    dx = (lon[..., None] - p[:, 0]) * 111.320 * np.cos(np.radians(lat0))
    dy = (lat[..., None] - p[:, 1]) * 110.570
    d = np.hypot(dx, dy)
    return d.min(-1), d.argmin(-1)


def classify(r):
    return np.digitize(r, CLASS_EDGES)


# --------------------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("case", choices=CASES)
    args = ap.parse_args()
    cid, case = args.case, CASES[args.case]
    kind, bbox = case["kind"], case["bbox"]
    hz = HAZARD[kind]
    out = WEB_DATA / cid
    cache = RAW / "risk" / cid
    cache.mkdir(parents=True, exist_ok=True)
    man = json.loads((out / "manifest.json").read_text(encoding="utf-8"))
    lat0 = (bbox[1] + bbox[3]) / 2

    # ---- grids
    mask, ftr = load_mask(cid, bbox)
    fshape = mask.shape
    ncol, nrow = round((bbox[2] - bbox[0]) / CELL_DEG), round((bbox[3] - bbox[1]) / CELL_DEG)
    cshape, ctr = (nrow, ncol), from_bounds(*bbox, ncol, nrow)
    cell_km2 = (abs(ctr.a) * 111.320 * np.cos(np.radians(lat0))) * (abs(ctr.e) * 110.570)
    fpx_ha = (abs(ftr.a) * 111320 * np.cos(np.radians(lat0))) * (abs(ftr.e) * 110570) / 1e4
    avg = lambda a: to_grid(a, ftr, cshape, ctr, Resampling.average)
    lon = ctr.c + (np.arange(ncol) + 0.5) * ctr.a
    lat = ctr.f + (np.arange(nrow) + 0.5) * ctr.e
    LON, LAT = np.meshgrid(lon, lat)

    # ---- land cover and slope on the fine grid
    wc = worldcover(fshape, ftr, bbox, cache / "worldcover.npz")
    lc = {name: avg(wc == code) for code, name in WC_CLASSES.items()}
    slope = slope_deg(fshape, ftr, bbox, cache / "slope.npz")
    slope_c = avg(slope)
    land = avg(wc > 0)  # share of the cell that is not sea / nodata

    # ---- HAZARD: fuse radar with the official reference
    ref_file = man["overlays"].get("effis") or man["overlays"].get("ems")
    ref_feats = load_geojson(out / ref_file) if ref_file else []
    ref = rasterize([(f["geometry"], 1) for f in ref_feats], out_shape=fshape, transform=ftr).astype(bool) if ref_feats else np.zeros(fshape, bool)
    natural = np.isin(wc, (10, 20, 30)) if kind == "fire" else np.ones(fshape, bool)  # crops outside EFFIS = harvest
    both, ref_only, radar_only = mask & ref, ref & ~mask, mask & ~ref & natural
    f_both, f_ref, f_radar = avg(both), avg(ref_only), avg(radar_only)

    intensity = np.ones(cshape)
    firms = load_geojson(out / man["overlays"]["firms"]) if man["overlays"].get("firms") else []
    if firms:
        frp = np.zeros(cshape)
        xy = np.array([f["geometry"]["coordinates"][:2] for f in firms])
        col, row = ((xy[:, 0] - ctr.c) / ctr.a).astype(int), ((xy[:, 1] - ctr.f) / ctr.e).astype(int)
        ok = (col >= 0) & (col < ncol) & (row >= 0) & (row < nrow)
        np.add.at(frp, (row[ok], col[ok]), np.array([f["properties"].get("frp") or 0 for f in firms])[ok])
        p90 = np.percentile(frp[frp > 0], 90) if (frp > 0).any() else 1
        intensity = hz["intensity_floor"] + (1 - hz["intensity_floor"]) * np.clip(frp / p90, 0, 1)

    footprint = both | ref_only | radar_only
    dist = distance_transform_edt(~footprint, sampling=(abs(ftr.e) * 110570, abs(ftr.a) * 111320 * np.cos(np.radians(lat0))))
    edge = avg(np.clip(1 - dist / hz["edge_m"], 0, 1) * ~footprint)

    def hazard(w_ref, w_radar, w_edge):
        direct = np.clip((f_both + w_ref * f_ref + w_radar * f_radar) * intensity, 0, 1)
        return np.maximum(direct, w_edge * edge), direct

    H, H_direct = hazard(hz["w_ref_only"], hz["w_radar_only"], hz["w_edge"])
    seen = f_both + f_ref + f_radar
    confidence = np.where(seen > 0, f_both / np.maximum(seen, 1e-9), 0)  # share confirmed by both sources

    # ---- EXPOSURE
    pop_f, pop_tr = read_window(fetch(POP_URL, RAW / "pop" / "esp_ppp_2020_constrained.tif"), bbox, pad=0.01)
    pop = to_grid(pop_f, pop_tr, cshape, ctr, Resampling.sum)
    osm = overpass(bbox, RAW / "osm" / f"{cid}_risk.json")["elements"]
    ways = [e for e in osm if e["type"] == "way" and "geometry" in e]
    roads_km = line_km([w for w in ways if "highway" in w.get("tags", {})], cshape, ctr, lat0)
    rail_km = line_km([w for w in ways if "railway" in w.get("tags", {})], cshape, ctr, lat0)
    tagged = [e for e in osm if "geometry" not in e and pt(e)[0] is not None]
    amen = lambda *names: [pt(e) for e in tagged if e.get("tags", {}).get("amenity") in names or e.get("tags", {}).get("social_facility") in names]
    hospitals, stations = amen("hospital"), amen("fire_station")
    critical = np.zeros(cshape)
    for x, y in amen("hospital", "fire_station", "school", "kindergarten", "clinic", "nursing_home", "police"):
        c, r = int((x - ctr.c) / ctr.a), int((y - ctr.f) / ctr.e)
        if 0 <= c < ncol and 0 <= r < nrow:
            critical[r, c] += 1
    print(f"[osm] {len(ways)} ways, {len(hospitals)} hospitals, {len(stations)} fire stations, {int(critical.sum())} critical facilities in the area")

    e_parts = {
        "population": np.clip(np.log1p(pop / cell_km2) / np.log1p(POP_DENSITY_REF), 0, 1),
        "built": np.clip(lc["built"] / BUILT_REF, 0, 1),
        "infrastructure": np.clip((roads_km + 2 * rail_km) / INFRA_REF_KM, 0, 1),
        "critical": np.clip(critical, 0, 1),
        "land": np.clip(sum(lc[k] for k in LAND_ASSET[kind]), 0, 1),
    }

    # ---- VULNERABILITY
    dep = None
    for age in DEPENDENT_AGES:
        for sex in "fm":
            a, age_tr = read_window(fetch(AGE_URL.format(sex=sex, age=age), RAW / "pop" / "age" / f"esp_{sex}_{age}_2020_1km.tif"), bbox, pad=0.02)
            dep = a if dep is None else dep + a
    tot, _ = read_window(fetch(POP1K_URL, RAW / "pop" / "esp_ppp_2020_1km_Aggregated.tif"), bbox, pad=0.02)
    share = np.where(tot >= 5, dep / np.maximum(tot, 1e-9), np.nan)  # too few people: no reliable age structure
    area_share = float(np.nansum(np.where(tot >= 5, dep, 0)) / max(np.nansum(np.where(tot >= 5, tot, 0)), 1e-9))
    share = to_grid(np.nan_to_num(share, nan=area_share), age_tr, cshape, ctr, Resampling.bilinear)
    share = np.where(share > 0, share, area_share)
    d_hosp, _ = nearest_km(LON, LAT, hospitals, lat0)
    d_fire, _ = nearest_km(LON, LAT, stations, lat0)
    places = [(pt(e), e["tags"].get("name")) for e in tagged if e.get("tags", {}).get("place") and e["tags"].get("name")]
    _, place_idx = nearest_km(LON, LAT, [p for p, _ in places], lat0)

    v_parts = {
        "physical": np.clip(sum(lc[k] * s for k, s in SUSCEPTIBILITY[kind].items()) / np.maximum(land, 1e-9), 0, 1),
        "social": np.clip(share / AGE_DEP_REF, 0, 1),
        "coping": np.clip(0.5 * np.nan_to_num(d_hosp, nan=HOSPITAL_REF_KM) / HOSPITAL_REF_KM
                          + 0.5 * np.nan_to_num(d_fire, nan=FIRE_STATION_REF_KM) / FIRE_STATION_REF_KM, 0, 1),
    }

    combine = lambda parts, w: sum(parts[k] * w[k] for k in w) / sum(w.values())
    E, V = combine(e_parts, EXPOSURE_W), combine(v_parts, VULNERABILITY_W)
    R = np.cbrt(H * E * V)
    cls = classify(R)
    keep = (H >= MIN_HAZARD) & (land > 0.05)

    # ---- CASCADE screening (secondary hazard triggered by this event)
    slope_f = np.clip(slope_c / SLOPE_REF_DEG, 0, 1)
    if kind == "fire":
        cascade = H_direct * slope_f
        steep_ha = float((footprint & (slope >= STEEP_DEG)).sum() * fpx_ha)
        cascade_info = {"type": "post_fire_runoff", "burned_steep_ha": round(steep_ha),
                        "steep_deg": STEEP_DEG}
    else:
        rain = next((m["value"] for m in man["metrics"] if m["id"] == "rain"), 0)
        trigger = min(1.0, rain / RAIN_REF_MM)
        cascade = trigger * slope_f * np.clip((roads_km + 2 * rail_km) / INFRA_REF_KM, 0, 1)
        cascade_info = {"type": "rain_slope_failure", "rain_mm": rain, "steep_deg": STEEP_DEG}
    hot = cascade >= 0.3
    cascade_info.update({"cells": int(hot.sum()), "roads_km": round(float(roads_km[hot].sum()), 1), "rail_km": round(float(rail_km[hot].sum()), 1)})

    # ---- Monte Carlo: perturb every weight by +/-25 %
    rng = np.random.default_rng(42)
    same = np.zeros(cshape)
    pop_high = []
    jitter = lambda w: {k: v * rng.uniform(1 - MC_SPREAD, 1 + MC_SPREAD) for k, v in w.items()}
    for _ in range(MC_RUNS):
        j = jitter({k: hz[k] for k in ("w_ref_only", "w_radar_only", "w_edge")})
        h, _ = hazard(min(1, j["w_ref_only"]), min(1, j["w_radar_only"]), j["w_edge"])
        r = np.cbrt(h * combine(e_parts, jitter(EXPOSURE_W)) * combine(v_parts, jitter(VULNERABILITY_W)))
        c = classify(r)
        same += c == cls
        pop_high.append(float(pop[keep & (c >= 3)].sum()))
    stability = same / MC_RUNS

    # ---- export cells
    rows, feats = [], []
    for r, c in zip(*np.nonzero(keep)):
        x0, y1 = ctr.c + c * ctr.a, ctr.f + r * ctr.e
        x1, y0 = x0 + ctr.a, y1 + ctr.e
        row = {
            "lon": round(float(LON[r, c]), 4), "lat": round(float(LAT[r, c]), 4),
            "risk": round(float(R[r, c]), 3), "class": CLASS_NAMES[cls[r, c]],
            "hazard": round(float(H[r, c]), 3), "exposure": round(float(E[r, c]), 3), "vulnerability": round(float(V[r, c]), 3),
            "population": round(float(pop[r, c]), 1), "built_pct": round(float(100 * lc["built"][r, c]), 1),
            "roads_km": round(float(roads_km[r, c]), 2), "rail_km": round(float(rail_km[r, c]), 2),
            "critical_facilities": int(critical[r, c]), "dependent_age_pct": round(float(100 * share[r, c]), 1),
            "hospital_km": round(float(d_hosp[r, c]), 1), "fire_station_km": round(float(d_fire[r, c]), 1),
            "slope_deg": round(float(slope_c[r, c]), 1), "cascade": round(float(cascade[r, c]), 2),
            "confidence": round(float(confidence[r, c]), 2), "stability": round(float(stability[r, c]), 2),
            "place": places[place_idx[r, c]][1] if places else "",
        }
        rows.append(row)
        feats.append({"type": "Feature",
                      "geometry": {"type": "Polygon", "coordinates": [[[round(x0, 5), round(y0, 5)], [round(x1, 5), round(y0, 5)], [round(x1, 5), round(y1, 5)], [round(x0, 5), round(y1, 5)], [round(x0, 5), round(y0, 5)]]]},
                      "properties": {**{k: row[k] for k in ("risk", "hazard", "exposure", "vulnerability", "population", "roads_km", "rail_km", "critical_facilities", "dependent_age_pct", "hospital_km", "slope_deg", "cascade", "confidence", "stability", "place")},
                                     "cls": int(cls[r, c])}})
    (out / "risk.geojson").write_text(json.dumps({"type": "FeatureCollection", "features": feats}, separators=(",", ":")), encoding="utf-8")
    with open(out / "risk.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(sorted(rows, key=lambda x: -x["risk"]))

    # ---- summary for the web panel
    classes = [{"cls": CLASS_NAMES[i], "cells": int((keep & (cls == i)).sum()), "area_ha": round(float((keep & (cls == i)).sum() * cell_km2 * 100)),
                "population": round(float(pop[keep & (cls == i)].sum()))} for i in range(5)]
    sig = keep & (cls >= 2)  # medium and above
    mean = lambda a: round(float(a[sig].mean()), 2) if sig.any() else 0
    top = sorted(rows, key=lambda x: -x["risk"])[:5]
    high = keep & (cls >= 3)
    man["risk"] = {
        "generated": dt.date.today().isoformat(),
        "model": "risk = (hazard x exposure x vulnerability)^(1/3), INFORM-style geometric mean, 0-1 per cell",
        "cell_m": [round(abs(ctr.a) * 111320 * np.cos(np.radians(lat0))), round(abs(ctr.e) * 110570)],
        "cells": int(keep.sum()),
        "classes": classes,
        "pop_high": round(float(pop[high].sum())),
        "pop_high_range": [round(float(np.percentile(pop_high, 5))), round(float(np.percentile(pop_high, 95)))],
        "pop_expected": round(float((pop * H_direct)[keep].sum())),
        "roads_high_km": round(float(roads_km[high].sum()), 1),
        "rail_high_km": round(float(rail_km[high].sum()), 1),
        "critical_high": int(critical[high].sum()),
        "components": {"hazard": mean(H), "exposure": mean(E), "vulnerability": mean(V)},
        "drivers": {"exposure": {k: mean(v) for k, v in e_parts.items()}, "vulnerability": {k: mean(v) for k, v in v_parts.items()}},
        "dependent_age_pct": round(100 * area_share, 1),
        "hotspots": [{k: t[k] for k in ("place", "lon", "lat", "risk", "class", "hazard", "exposure", "vulnerability", "population")} for t in top],
        "cascade": cascade_info,
        "stability": {"runs": MC_RUNS, "spread_pct": round(100 * MC_SPREAD),
                      "stable_high_pct": round(float(100 * (stability[high] >= 0.8).mean())) if high.any() else None,
                      "mean_pct": round(float(100 * stability[keep].mean()))},
        "weights": {"hazard": {k: v for k, v in hz.items()}, "exposure": EXPOSURE_W, "vulnerability": VULNERABILITY_W,
                    "class_edges": CLASS_EDGES},
        "sources": SOURCES,
        "files": {"geojson": "risk.geojson", "csv": "risk.csv"},
    }
    man["overlays"]["risk"] = "risk.geojson"
    (out / "manifest.json").write_text(json.dumps(man, indent=1, ensure_ascii=False), encoding="utf-8")

    print(f"[risk] {keep.sum()} cells of {man['risk']['cell_m']} m")
    for c in classes:
        print(f"   {c['cls']:<10} {c['cells']:>5} cells  {c['area_ha']:>7} ha  {c['population']:>7} people")
    print(f"[risk] people in high / very high cells: {man['risk']['pop_high']} (5-95 %: {man['risk']['pop_high_range']})")
    print(f"[risk] mean H/E/V in medium+ cells: {man['risk']['components']}")
    print(f"[risk] cascade: {cascade_info}")
    print(f"[risk] stability: {man['risk']['stability']}")
    for t in top:
        print(f"   hotspot {t['risk']} near {t['place']}  H{t['hazard']} E{t['exposure']} V{t['vulnerability']} pop {t['population']}")


if __name__ == "__main__":
    main()
