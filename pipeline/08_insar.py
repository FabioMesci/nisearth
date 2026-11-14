"""Paso 8: interferometría radar (InSAR) con los productos NISAR L2 GUNW.

Un GUNW es un interferograma ya calculado por el JPL entre dos pasadas de la misma órbita:
la fase desenrollada mide cuánto se ha acercado o alejado el suelo del satélite (línea de visión)
entre las dos fechas. Una vuelta de fase (2π) = media longitud de onda = 11,9 cm en banda L.

Para cada caso con bloque "insar" en config.py:
  extract  lee SOLO el recorte de cada GUNW por HTTPS (fase, coherencia, componentes conexas,
           pantalla de fase ionosférica) y lo lleva a la rejilla común del caso -> data/work/<caso>/gunw_*.tif
  process  corrige rampa orbital (+ ionosfera suave) y atmósfera ligada al relieve, pasa a centímetros,
           suma los pares encadenados (desplazamiento acumulado) y genera las imágenes web y el manifest.

Uso:
  python 08_insar.py extract granada
  python 08_insar.py process granada
"""
import argparse
import json
import re
from datetime import date
from pathlib import Path

import asf_search as asf
import earthaccess
import h5py
import numpy as np
import rasterio
from PIL import Image
from pyproj import Transformer
from rasterio.transform import from_bounds
from rasterio.warp import Resampling, reproject
from scipy.ndimage import binary_dilation, gaussian_filter, uniform_filter
from shapely.geometry import box

from config import CASES, WEB_DATA, WORK, earthdata_login

WAVELENGTH_M = 299_792_458 / 1.2575e9  # NISAR L-SAR, frecuencia A (~23,8 cm)
PHASE_TO_CM = WAVELENGTH_M / (4 * np.pi) * 100  # rad -> cm en la línea de visión
GRP = "/science/LSAR/GUNW/grids/frequencyA/unwrappedInterferogram"
DEM_URL = "https://copernicus-dem-30m.s3.amazonaws.com/{name}/{name}.tif"
MAX_W = 1600


# ------------------------------------------------------------------ búsqueda
def parse_id(fid: str):
    """NISAR_L2_PR_GUNW_<ciclo>_<pasada>_<A|D>_<frame>_..._<ref inicio>_<ref fin>_<sec inicio>_<sec fin>_..."""
    m = re.search(r"GUNW_\d+_(\d+)_([AD])_(\d+)_.*?_(\d{8})T\d+_\d{8}T\d+_(\d{8})T\d+", fid)
    trk, d, frame, a, b = m.groups()
    iso = lambda s: f"{s[:4]}-{s[4:6]}-{s[6:]}"
    return int(trk), d, int(frame), iso(a), iso(b)


def find_gunw(case):
    res = asf.search(dataset="NISAR", processingLevel="GUNW", intersectsWith=box(*case["bbox"]).wkt,
                     start=case["window"][0], end=case["window"][1], maxResults=2000)
    rows = []
    for r in res:
        fid = r.properties["fileID"]
        trk, d, frame, a, b = parse_id(fid)
        rows.append({"id": fid, "url": r.properties["url"], "track": trk, "dir": d, "frame": frame, "ref": a, "sec": b})
    return rows


def select_pairs(case, rows):
    """Pares a usar: los indicados (modo pairs) o la cadena de pares consecutivos de una pasada (modo chain)."""
    ins = case["insar"]
    if ins["mode"] == "pairs":
        want = {(t, a, b) for t, a, b in ins["pairs"]}
        pairs = sorted(want, key=lambda p: [x[:3] for x in ins["pairs"]].index(p))
    else:
        cand = sorted({(r["track"], r["ref"], r["sec"]) for r in rows if r["track"] == ins["track"]}, key=lambda p: (p[1], p[2]))
        pairs, cur = [], None
        for p in cand:  # encadenar: cada par empieza donde terminó el anterior (el más corto)
            if cur is None or p[1] == cur:
                if pairs and pairs[-1][1] == p[1]:
                    continue
                pairs.append(p)
                cur = p[2]
    out = []
    for t, a, b in pairs:
        parts = [r for r in rows if (r["track"], r["ref"], r["sec"]) == (t, a, b)]
        if parts:
            out.append({"track": t, "dir": parts[0]["dir"], "ref": a, "sec": b, "parts": parts})
        else:
            print(f"[warn] sin GUNW para {t} {a}->{b}")
    return out


# ------------------------------------------------------------------ rejilla común
def grid(case):
    res = case["insar"]["res"]
    x0, y0, x1, y1 = case["bbox"]
    w, h = int(round((x1 - x0) / res)), int(round((y1 - y0) / res))
    return from_bounds(x0, y0, x1, y1, w, h), w, h


def read_epsg(h5):
    for p in (f"{GRP}/projection", "/science/LSAR/GUNW/grids/frequencyA/unwrappedInterferogram/HH/projection"):
        if p in h5:
            ds = h5[p]
            for k in ("epsg_code", "epsg"):
                if k in ds.attrs:
                    return int(np.squeeze(ds.attrs[k]))
            return int(np.squeeze(ds[()]))
    raise KeyError("sin proyección")


def extract_one(fobj, case):
    """(4, H, W): fase desenrollada (rad), coherencia, componente conexa, fase ionosférica (rad)."""
    tr_dst, w, h = grid(case)
    with h5py.File(fobj, "r") as h5:
        g = h5[f"{GRP}/HH"]
        epsg = read_epsg(h5)
        x, y = h5[f"{GRP}/xCoordinates"][:], h5[f"{GRP}/yCoordinates"][:]
        t = Transformer.from_crs(4326, epsg, always_xy=True)
        x0, y0, x1, y1 = case["bbox"]
        gx, gy = np.meshgrid(np.linspace(x0, x1, 20), np.linspace(y0, y1, 20))
        px, py = t.transform(gx, gy)
        dx, dy = x[1] - x[0], y[1] - y[0]
        cols = np.where((x >= px.min() - 5 * dx) & (x <= px.max() + 5 * dx))[0]
        rows = np.where((y >= py.min() - 5 * abs(dy)) & (y <= py.max() + 5 * abs(dy)))[0]
        if cols.size < 5 or rows.size < 5:
            return None
        r0, r1, c0, c1 = rows.min(), rows.max() + 1, cols.min(), cols.max() + 1
        bands = {
            "unw": g["unwrappedPhase"][r0:r1, c0:c1].astype("float32"),
            "coh": g["coherenceMagnitude"][r0:r1, c0:c1].astype("float32"),
            "cc": g["connectedComponents"][r0:r1, c0:c1].astype("float32"),
            "iono": g["ionospherePhaseScreen"][r0:r1, c0:c1].astype("float32"),
        }
        src_tr = rasterio.Affine(dx, 0, x[c0] - dx / 2, 0, dy, y[r0] - dy / 2)
    out = np.full((4, h, w), np.nan, "float32")
    for i, k in enumerate(("unw", "coh", "cc", "iono")):
        a = bands[k]
        if k != "cc":
            a[~np.isfinite(a) | (a == 0)] = np.nan
        how = Resampling.nearest if k == "cc" else Resampling.bilinear
        reproject(a, out[i], src_transform=src_tr, src_crs=f"EPSG:{epsg}", dst_transform=tr_dst, dst_crs="EPSG:4326",
                  src_nodata=np.nan, dst_nodata=np.nan, resampling=how)
    return out


def tag(p):
    return f"{p['track']}_{p['ref'].replace('-', '')}_{p['sec'].replace('-', '')}"


def cmd_extract(cid, track=None):
    case = CASES[cid]
    if track:  # segunda geometría (otra pasada) para contrastar: se guarda aparte
        case = {**case, "insar": {**case["insar"], "mode": "chain", "track": track}}
    rows = find_gunw(case)
    pairs = select_pairs(case, rows)
    out = WORK / cid
    out.mkdir(parents=True, exist_ok=True)
    (out / (f"gunw_pairs_{track}.json" if track else "gunw_pairs.json")).write_text(json.dumps([{k: v for k, v in p.items()} for p in pairs], indent=1))
    earthdata_login()
    tr, w, h = grid(case)
    for p in pairs:
        f = out / f"gunw_{tag(p)}.tif"
        if f.exists():
            print(f"[skip] {f.name}")
            continue
        mosaic = None
        for part in p["parts"]:
            print(f"[read] {tag(p)} frame {part['frame']}", flush=True)
            data = extract_one(earthaccess.open([part["url"]])[0], case)
            if data is None:
                continue
            if mosaic is None:
                mosaic = data
            else:  # frames contiguos: rellenar huecos (la fase de cada frame puede tener otro offset; se corrige luego)
                mosaic = np.where(np.isfinite(mosaic[0]), mosaic, data)
        if mosaic is None:
            print("   sin cobertura")
            continue
        with rasterio.open(f, "w", driver="GTiff", width=w, height=h, count=4, dtype="float32", crs="EPSG:4326",
                           transform=tr, nodata=np.nan, compress="deflate") as ds:
            ds.write(mosaic)
        print(f"   ok {f.name}  válido {100 * np.isfinite(mosaic[0]).mean():.0f}%  coh media {np.nanmean(mosaic[1]):.2f}")


# ------------------------------------------------------------------ procesado
def dem_on_grid(case, cache):
    if cache.exists():
        return np.load(cache)["dem"]
    tr, w, h = grid(case)
    x0, y0, x1, y1 = case["bbox"]
    dem = np.full((h, w), np.nan, "float32")
    for lat in range(int(np.floor(y0)), int(np.floor(y1)) + 1):
        for lon in range(int(np.floor(x0)), int(np.floor(x1)) + 1):
            name = f"Copernicus_DSM_COG_10_{'N' if lat >= 0 else 'S'}{abs(lat):02d}_00_{'E' if lon >= 0 else 'W'}{abs(lon):03d}_00_DEM"
            part = np.full((h, w), np.nan, "float32")
            try:
                with rasterio.open(DEM_URL.format(name=name)) as src:
                    reproject(rasterio.band(src, 1), part, dst_transform=tr, dst_crs="EPSG:4326", dst_nodata=np.nan, resampling=Resampling.bilinear)
            except rasterio.errors.RasterioIOError:
                continue
            dem = np.where(np.isnan(dem), part, dem)
    np.savez_compressed(cache, dem=dem)
    return dem


def km_grid(case):
    tr, w, h = grid(case)
    lon = tr.c + (np.arange(w) + 0.5) * tr.a
    lat = tr.f + (np.arange(h) + 0.5) * tr.e
    lat0 = (case["bbox"][1] + case["bbox"][3]) / 2
    X, Y = np.meshgrid((lon - lon.mean()) * 111.32 * np.cos(np.radians(lat0)), (lat - lat.mean()) * 110.57)
    return X, Y, lon, lat


def correct(unw, coh, cc, iono, dem, X, Y, excl):
    """Fase -> cm en la línea de visión, sin ionosfera, rampa orbital ni atmósfera proporcional a la altura.
    Signo: positivo = el suelo se acerca al satélite (sube), negativo = se aleja (se hunde)."""
    # la pantalla ionosférica del producto (split-spectrum) es ruidosa a escala de decenas de km: en estas escenas
    # pequeñas de latitud media empeora el resultado (Lorca: ruido acumulado 4,7 cm con ella, 2,4 cm sin ella),
    # así que solo se aplica si se pasa explícitamente; la rampa ajustada absorbe la ionosfera suave
    ph = unw - (np.nan_to_num(iono, nan=0.0) if iono is not None else 0.0)
    good = np.isfinite(ph) & (coh >= 0.3) & (cc > 0)
    # cada componente conexa puede tener un salto de 2π: quedarse con la mayor (las demás, fuera)
    if good.any():
        ids, n = np.unique(cc[good], return_counts=True)
        good &= cc == ids[np.argmax(n)]
    d = np.where(good, -ph * PHASE_TO_CM, np.nan)
    fit = good & ~excl & np.isfinite(dem)
    if fit.sum() > 200:
        A = np.column_stack([np.ones(fit.sum()), X[fit], Y[fit], dem[fit] / 1000])
        coef, *_ = np.linalg.lstsq(A, d[fit], rcond=None)
        model = coef[0] + coef[1] * X + coef[2] * Y + coef[3] * np.nan_to_num(dem) / 1000
        d = d - model
    elif good.any():
        d = d - np.nanmedian(d[good])
    return d.astype("float32"), good


def colorize_disp(d, vmax):
    """Rojo = se aleja del satélite (hundimiento), azul = se acerca (levantamiento)."""
    t = np.clip(np.nan_to_num(d) / vmax, -1, 1)
    r = np.where(t < 0, 255, 255 * (1 - t))
    g = 255 * (1 - np.abs(t)) * 0.9
    b = np.where(t > 0, 255, 255 * (1 + t))
    r = np.where(t < 0, 255 - 40 * np.abs(t), r)
    a = (0.25 + 0.75 * np.clip(np.abs(t) * 1.4, 0, 1)) * 235
    a[~np.isfinite(d)] = 0
    return np.dstack([r, g, b, a])


def colorize_fringes(d, cycle):
    """Franjas: el desplazamiento reenvuelto en ciclos de `cycle` cm, con una paleta cíclica."""
    ph = np.mod(np.nan_to_num(d) / cycle, 1.0)
    h6 = ph * 6
    i = np.floor(h6).astype(int) % 6
    f = h6 - np.floor(h6)
    q, tt = 1 - f, f
    lut = [(1, tt, 0), (q, 1, 0), (0, 1, tt), (0, q, 1), (tt, 0, 1), (1, 0, q)]
    rgb = np.zeros((*d.shape, 3))
    for k, (r, g, b) in enumerate(lut):
        m = i == k
        for c, v in enumerate((r, g, b)):
            rgb[..., c][m] = (v if np.isscalar(v) else v[m])
    rgb = 40 + rgb * 200
    a = np.where(np.isfinite(d), 215, 0)
    return np.dstack([rgb, a])


def colorize_coh(c):
    t = np.clip(np.nan_to_num(c), 0, 1)
    r, g, b = 30 + 225 * t, 20 + 200 * t ** 1.4, 70 + 60 * t - 40 * t ** 2
    a = np.where(np.isfinite(c), 225, 0)
    return np.dstack([r, g, b, a])


def save_web(rgba, path):
    im = Image.fromarray(np.clip(rgba, 0, 255).astype("uint8"), "RGBA")
    if im.width > MAX_W:
        im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.Resampling.BILINEAR)
    im.save(path, "WEBP", quality=82, method=5)


def disc_mean(a, X, Y, x, y, r_km):
    m = ((X - x) ** 2 + (Y - y) ** 2 <= r_km ** 2) & np.isfinite(a)
    return float(np.nanmedian(a[m])) if m.sum() > 3 else float("nan")


def cmd_process(cid):
    case = CASES[cid]
    ins = case["insar"]
    work = WORK / cid
    pairs = json.loads((work / "gunw_pairs.json").read_text())
    pairs = [p for p in pairs if (work / f"gunw_{tag(p)}.tif").exists()]
    tr, w, h = grid(case)
    X, Y, lon, lat = km_grid(case)
    dem = dem_on_grid(case, work / "dem.npz")
    lon0 = lon.mean(); lat0 = lat.mean()
    kx = lambda lo: (lo - lon0) * 111.32 * np.cos(np.radians((case["bbox"][1] + case["bbox"][3]) / 2))
    ky = lambda la: (la - lat0) * 110.57

    # 1) corregir cada par (primera pasada sin zona excluida si no hay epicentro conocido)
    hot = ins.get("hotspot")
    raw = []
    for p in pairs:
        with rasterio.open(work / f"gunw_{tag(p)}.tif") as ds:
            unw, coh, cc, iono = ds.read()
        raw.append((p, unw, coh, cc, iono))

    def run(excl):
        return [(p, *correct(unw, coh, cc, iono if ins.get("iono") else None, dem, X, Y, excl), coh) for p, unw, coh, cc, iono in raw]

    if hot:
        hx, hy = kx(hot[0]), ky(hot[1])
        excl = (X - hx) ** 2 + (Y - hy) ** 2 <= ins["exclude_km"] ** 2
        done = run(excl)
    else:
        done = run(np.zeros_like(X, bool))
    # 2) acumulado (cadena) o pares independientes
    if ins["mode"] == "chain":
        cum = np.zeros_like(X, "float32")
        valid = np.zeros_like(X, int)
        stack = []
        for p, d, good, coh in done:
            cum = cum + np.nan_to_num(d)
            valid += np.isfinite(d)
            stack.append(cum.copy())
        need = max(1, int(0.7 * len(done)))
        final = np.where(valid >= need, cum, np.nan)
        if not hot:  # zona que más se mueve = punto caliente; se repite la corrección excluyéndola
            sm = gaussian_filter(np.nan_to_num(final), 3)
            j = np.unravel_index(np.argmax(np.abs(sm)), sm.shape)
            hot = (float(lon[j[1]]), float(lat[j[0]]))
            hx, hy = kx(hot[0]), ky(hot[1])
            excl = (X - hx) ** 2 + (Y - hy) ** 2 <= ins["exclude_km"] ** 2
            done = run(excl)
            cum = np.zeros_like(X, "float32"); valid = np.zeros_like(X, int); stack = []
            for p, d, good, coh in done:
                cum = cum + np.nan_to_num(d); valid += np.isfinite(d); stack.append(cum.copy())
            final = np.where(valid >= need, cum, np.nan)
        # saltos de desenrollado: valores imposibles para el fenómeno (> 12 cm o 3 escalas) quedan fuera
        jump = np.isfinite(final) & (np.abs(final) > max(12.0, 3 * ins["vmax_cm"]))
        final = np.where(jump, np.nan, final)
        frames_d = [np.where((valid >= need) & ~jump, s, np.nan) for s in stack]
    else:
        frames_d = [d for p, d, good, coh in done]
        final = frames_d[-1]
    cohs = [coh for p, d, good, coh in done]

    # 3) imágenes
    out = WEB_DATA / cid
    out.mkdir(parents=True, exist_ok=True)
    for old in [*out.glob("*.webp"), *out.glob("*.png")]:
        old.unlink()
    vmax, cyc = ins["vmax_cm"], ins["fringe_cm"]
    frames, series_d, series_c = [], [], []
    hx, hy = kx(hot[0]), ky(hot[1])
    # zona de interés para la serie: la colada (ref.geojson) o el trazado del AVE (rail.geojson), frente a un anillo alrededor
    region = None
    from rasterio.features import rasterize
    from shapely.geometry import LineString, shape
    if (out / "ref.geojson").exists():
        geoms = [shape(f["geometry"]) for f in json.loads((out / "ref.geojson").read_text())["features"]]
        region = rasterize(geoms, out_shape=(h, w), transform=tr).astype(bool)
    elif (work / "rail.geojson").exists():
        lines = [LineString(f["geometry"]["coordinates"]) for f in json.loads((work / "rail.geojson").read_text())["features"]
                 if f["properties"].get("highspeed") == "yes"]
        region = rasterize([l.buffer(0.0006) for l in lines], out_shape=(h, w), transform=tr).astype(bool) if lines else None
    if region is not None:
        ring = binary_dilation(region, iterations=int(round(1.0 / 111.0 / ins["res"]))) & ~region  # anillo de ~1 km
    for (p, *_), d, c in zip(done, frames_d, cohs):
        t = tag(p)
        save_web(colorize_disp(d, vmax), out / f"d_{t}.webp")
        save_web(colorize_fringes(d, cyc), out / f"f_{t}.webp")
        save_web(colorize_coh(c), out / f"c_{t}.webp")
        frames.append({"date": p["sec"], "ref": p["ref"], "track": p["track"], "dir": p["dir"],
                       "hh": f"d_{t}.webp", "hv": f"f_{t}.webp", "rgb": f"c_{t}.webp"})
        if region is not None:
            series_d.append(round(float(np.nanmedian(d[region]) - np.nanmedian(d[ring])), 2))
        else:
            series_d.append(round(disc_mean(d, X, Y, hx, hy, 0.4), 2))
        series_c.append(round(float(np.nanmean(c)), 2))
    save_web(colorize_disp(final, vmax), out / "change.webp")
    with rasterio.open(work / "insar_final.tif", "w", driver="GTiff", width=w, height=h, count=2, dtype="float32",
                       crs="EPSG:4326", transform=tr, nodata=np.nan, compress="deflate") as ds:
        ds.write(np.stack([final, np.nanmean(np.stack(cohs), 0)]).astype("float32"))

    # máscara: zona que se mueve de forma coherente (> umbral y más que el ruido de fondo)
    bg = final[np.isfinite(final) & ~excl] if np.isfinite(final[~excl]).any() else final[np.isfinite(final)]
    noise = float(np.nanstd(bg)) if bg.size else 0.5
    thr = max(ins.get("mask_cm", 0) or 0, 2.5 * noise)
    sm = uniform_filter(np.nan_to_num(final), 3)
    moving = np.isfinite(final) & (np.abs(sm) > thr)
    if ins["mode"] == "pairs":
        # pares independientes: solo cuenta lo que se repite con el mismo signo en todas las pasadas
        # de un mismo sentido (dos descendentes deben ver lo mismo); lo demás es atmósfera
        moving = np.zeros_like(moving)
        for dr in {p["dir"] for p, *_ in done}:
            ds_ = [uniform_filter(np.nan_to_num(d), 3) for (p, *_), d in zip(done, frames_d) if p["dir"] == dr]
            if len(ds_) < 2:
                continue
            st = np.stack(ds_)
            moving |= (np.all(st > thr, 0) | np.all(st < -thr, 0))
    moving &= binary_dilation(moving, iterations=1)
    rgba = np.zeros((h, w, 4), "uint8")
    rgba[moving] = (217, 70, 239, 200)
    Image.fromarray(rgba, "RGBA").save(out / "mask.png", optimize=True)
    px_ha = (abs(tr.a) * 111320 * np.cos(np.radians(lat0))) * (abs(tr.e) * 110570) / 1e4

    first = date.fromisoformat(done[0][0]["ref"])
    last = date.fromisoformat(done[-1][0]["sec"])
    days = (last - first).days
    hot_val = series_d[-1] if region is not None else disc_mean(final, X, Y, hx, hy, 0.4)
    peak = float(np.nanpercentile(final, 0.5)) if np.nanmedian(final) <= hot_val else float(np.nanpercentile(final, 99.5))
    metrics = []
    rate = float("nan")
    if ins["mode"] == "chain":
        # velocidad = pendiente de la recta ajustada a toda la serie (empieza en 0 el primer día): menos sensible
        # a la atmósfera de una sola fecha que dividir el último valor entre los días
        t = np.array([0] + [(date.fromisoformat(f["date"]) - first).days for f in frames], float)
        v = np.array([0.0] + series_d, float)
        ok = np.isfinite(v)
        rate = float(np.polyfit(t[ok], v[ok], 1)[0] * 365) if ok.sum() >= 3 else float("nan")
        metrics += [
            {"id": "insar_cum" if region is None else "insar_cum_rel", "label": "Desplazamiento acumulado en el punto que más se mueve", "value": round(hot_val, 1) + 0.0, "unit": "cm"},
            {"id": "insar_rate", "label": "Velocidad (ajuste lineal de la serie)", "value": round(rate, 1) + 0.0, "unit": "cm/año"},
        ]
    else:
        vals = [v for v in series_d if np.isfinite(v)]
        metrics += [{"id": "insar_epi", "label": "Mayor desplazamiento cerca del epicentro (cualquier pasada)", "value": round(max(vals, key=abs) if vals else float('nan'), 1), "unit": "cm"}]
    if region is None:  # en zonas acotadas (colada, vía) la serie ya compara con el entorno; un área sería ruido
        metrics.append({"id": "insar_area", "label": "Superficie que se mueve más que el ruido", "value": round(float(moving.sum() * px_ha)), "unit": "ha"})
    metrics += [
        {"id": "insar_noise", "label": "Ruido de fondo (desviación típica)", "value": round(noise, 1), "unit": "cm"},
        {"id": "insar_coh", "label": "Coherencia media", "value": round(100 * float(np.nanmean(series_c)), 0), "unit": "%"},
        {"id": "insar_n", "label": "Interferogramas NISAR usados", "value": len(done), "unit": ""},
    ]

    x0, y0, x1, y1 = case["bbox"]
    man_path = out / "manifest.json"
    manifest = {
        "id": cid, "title": case["title"], "kind": case["kind"], "event": case["event"], "mock": False,
        "bbox": [x0, y0, x1, y1], "center": [(x0 + x1) / 2, (y0 + y1) / 2],
        "coordinates": [[x0, y1], [x1, y1], [x1, y0], [x0, y0]],
        "pair": {"before": frames[0]["date"], "after": frames[-1]["date"]},
        "frames": frames,
        "layers": {"mask": "mask.png", "change": "change.webp"},
        "series": {"dates": [f["date"] for f in frames], "hh": series_d, "hv": series_c},
        "metrics": metrics,
        "overlays": {},
        "insar": {
            "mode": ins["mode"], "product": "NISAR L2 GUNW", "wavelength_cm": round(WAVELENGTH_M * 100, 1),
            "vmax_cm": vmax, "fringe_cm": cyc, "hotspot": [round(hot[0], 4), round(hot[1], 4)],
            "noise_cm": round(noise, 2), "rate_cm_yr": round(rate, 1) if np.isfinite(rate) else None, "series": "region" if region is not None else "point", "threshold_cm": round(thr, 2), "days": days,
            "start": done[0][0]["ref"], "end": done[-1][0]["sec"],
            "pairs": [{"track": p["track"], "dir": p["dir"], "ref": p["ref"], "sec": p["sec"]} for p, *_ in done],
        },
    }
    # conservar lo que añaden otros pasos (contexto, Sentinel-1, eventos) si ya existía
    if man_path.exists():
        old = json.loads(man_path.read_text())
        for k in ("overlays", "s1", "stats", "daily", "refLabel"):
            if k in old and old[k]:
                manifest[k] = old[k]
    man_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=1))
    print(f"[ok] {cid}: {len(done)} pares, {days} días, punto {hot}, valor {hot_val:.2f} cm, ruido {noise:.2f} cm, "
          f"zona en movimiento {moving.sum() * px_ha:.0f} ha, serie {series_d}")

    # índice de casos de la web
    idx_path = WEB_DATA / "index.json"
    idx = json.loads(idx_path.read_text())
    idx = [c for c in idx if c["id"] != cid] + [{"id": cid, "title": case["title"], "kind": case["kind"],
                                                  "center": manifest["center"], "event": case["event"]}]
    idx_path.write_text(json.dumps(idx, ensure_ascii=False, indent=1))


# ------------------------------------------------------------------ contexto
OVERPASS = "https://overpass-api.de/api/interpreter"
UA = {"User-Agent": "nasa-space-apps-sar-pipeline"}


def overpass(q):
    import urllib.parse, urllib.request
    req = urllib.request.Request(OVERPASS, data=urllib.parse.urlencode({"data": q}).encode(), headers=UA)
    return json.loads(urllib.request.urlopen(req, timeout=180).read())


def emsc_events(case):
    """Terremotos del catálogo EMSC dentro del bbox (±40 días alrededor del evento)."""
    import urllib.request
    from datetime import timedelta
    x0, y0, x1, y1 = case["bbox"]
    ev = date.fromisoformat(case["event"])
    url = ("https://www.seismicportal.eu/fdsnws/event/1/query?format=json&minmag=2.0"
           f"&starttime={ev - timedelta(days=40)}&endtime={ev + timedelta(days=40)}"
           f"&minlat={y0}&maxlat={y1}&minlon={x0}&maxlon={x1}&limit=2000")
    d = json.loads(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read())
    feats = []
    for f in d["features"]:
        p = f["properties"]
        feats.append({"type": "Feature", "geometry": {"type": "Point", "coordinates": [p["lon"], p["lat"]]},
                      "properties": {"mag": p["mag"], "magtype": p.get("magtype"), "time": p["time"][:19], "depth": p.get("depth")}})
    feats.sort(key=lambda f: f["properties"]["mag"])
    return {"type": "FeatureCollection", "features": feats}


def osm_relation_polygon(rel_id):
    from shapely.geometry import LineString, mapping
    from shapely.ops import polygonize, unary_union
    d = overpass(f"[out:json][timeout:120];relation({rel_id});out geom;")
    rel = d["elements"][0]
    lines = [LineString([(g["lon"], g["lat"]) for g in m["geometry"]]) for m in rel["members"]
             if m["type"] == "way" and m.get("role", "outer") in ("outer", "") and "geometry" in m]
    inner = [LineString([(g["lon"], g["lat"]) for g in m["geometry"]]) for m in rel["members"]
             if m["type"] == "way" and m.get("role") == "inner" and "geometry" in m]
    poly = unary_union(list(polygonize(unary_union(lines))))
    if inner:
        poly = poly.difference(unary_union(list(polygonize(unary_union(inner)))))
    return poly, {"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {"name": rel["tags"].get("name")}, "geometry": mapping(poly)}]}


def osm_rail(case):
    x0, y0, x1, y1 = case["bbox"]
    d = overpass(f'[out:json][timeout:120];way["railway"="rail"]({y0},{x0},{y1},{x1});out geom tags;')
    feats = [{"type": "Feature", "properties": {"name": e["tags"].get("name"), "highspeed": e["tags"].get("highspeed")},
              "geometry": {"type": "LineString", "coordinates": [[g["lon"], g["lat"]] for g in e["geometry"]]}}
             for e in d["elements"] if "geometry" in e]
    return {"type": "FeatureCollection", "features": feats}


def cmd_context(cid):
    from rasterio.features import rasterize
    case = CASES[cid]
    ctx = case["insar"].get("context", {})
    out = WEB_DATA / cid
    man_path = out / "manifest.json"
    man = json.loads(man_path.read_text())
    man.setdefault("overlays", {})
    metrics = [m for m in man["metrics"] if not m["id"].startswith("ctx_")]
    if case["kind"] == "earthquake":
        ev = emsc_events(case)
        (out / "events.geojson").write_text(json.dumps(ev))
        man["overlays"]["events"] = "events.geojson"
        big = [f for f in ev["features"] if f["properties"]["mag"] >= 4.5]
        print(f"[emsc] {len(ev['features'])} sismos, {len(big)} de M4,5 o más")
        man["refLabel"] = "Sismicidad: EMSC (seismicportal.eu)"
    if ctx.get("osm_relation"):
        poly, gj = osm_relation_polygon(ctx["osm_relation"])
        (out / "ref.geojson").write_text(json.dumps(gj))
        man["overlays"]["ref"] = "ref.geojson"
        man["refLabel"] = ctx.get("ref_label", "© OpenStreetMap")
        with rasterio.open(WORK / cid / "insar_final.tif") as ds:
            final = ds.read(1)
            inside = rasterize([poly], out_shape=final.shape, transform=ds.transform).astype(bool)
        mov = np.isfinite(final) & (final < -man["insar"]["threshold_cm"])
        inn = np.nanmedian(final[inside & np.isfinite(final)])
        outv = np.nanmedian(final[~inside & np.isfinite(final)])
        pct_in = 100 * (mov & inside).sum() / max(1, mov.sum())
        metrics += [
            {"id": "ctx_in", "label": "Movimiento medio dentro de la colada", "value": round(float(inn), 1), "unit": "cm"},
            {"id": "ctx_out", "label": "Movimiento medio fuera de la colada", "value": round(float(outv), 1), "unit": "cm"},
        ]
        man.setdefault("stats", {}).update({"inside_cm": round(float(inn), 2), "outside_cm": round(float(outv), 2), "sinking_inside_pct": round(float(pct_in), 1)})
        print(f"[ref] dentro {inn:.2f} cm, fuera {outv:.2f} cm, {pct_in:.0f}% de lo que se hunde está dentro")
    if ctx.get("rail"):
        try:
            rail = osm_rail(case)
            (out / "rail.geojson").write_text(json.dumps(rail))
            (WORK / cid / "rail.geojson").write_text(json.dumps(rail))
            print(f"[osm] {len(rail['features'])} tramos de vía")
        except Exception as e:  # Overpass limita peticiones: se conserva la copia anterior
            print(f"[osm] sin respuesta ({e}); se usa la copia guardada")
            if (WORK / cid / "rail.geojson").exists():
                (out / "rail.geojson").write_text((WORK / cid / "rail.geojson").read_text())
        if (out / "rail.geojson").exists():
            man["overlays"]["rail"] = "rail.geojson"
    s1_dir = WORK / cid / "s1"
    if s1_dir.exists() and case["insar"].get("s1_pair"):
        man["s1"] = s1_frames(cid, case, out)
    s1_dir = WORK / cid / "s1"
    if s1_dir.exists() and case["insar"].get("s1_pair"):
        man["s1"] = s1_frames(cid, case, out)
    man["metrics"] = metrics
    man_path.write_text(json.dumps(man, ensure_ascii=False, indent=1))


def s1_frames(cid, case, out):
    """Sentinel-1 RTC (banda C) alrededor del evento: imágenes VV/VH/RGB y cambio del par antes/después."""
    import importlib.util
    spec = importlib.util.spec_from_file_location("p3", Path(__file__).with_name("03_process.py"))
    P = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(P)
    files = sorted((WORK / cid / "s1").glob("*_s1p*.tif"))
    S = {}
    for f in files:
        d = f.stem.split("_")[0]
        with rasterio.open(f) as ds:
            S[f"{d[:4]}-{d[4:6]}-{d[6:]}"] = (P.lee_filter(ds.read(1)), P.lee_filter(ds.read(2)), int(f.stem.split("_s1p")[1]))
    vv_lim = P.stretch(np.concatenate([v[0][np.isfinite(v[0])] for v in S.values()]))
    vh_lim = P.stretch(np.concatenate([v[1][np.isfinite(v[1])] for v in S.values()]))
    frames = []
    for d in sorted(S):
        vv, vh, trk = S[d]
        t = f"{d.replace('-', '')}_p{trk}"
        P.gray_png(vv, out / f"s1vv_{t}.png", *vv_lim)
        P.gray_png(vh, out / f"s1vh_{t}.png", *vh_lim)
        P.rgb_png(vv, vh, out / f"s1rgb_{t}.png", (vv_lim, vh_lim, (2.0, 12.0)))
        frames.append({"date": d, "track": trk, "hh": f"s1vv_{t}.webp", "hv": f"s1vh_{t}.webp", "rgb": f"s1rgb_{t}.webp"})
    b, a = case["insar"]["s1_pair"]
    P.diverging_png(S[a][0] - S[b][0], out / "s1_change.png", span=4.0)
    print(f"[s1] {len(frames)} fechas Sentinel-1, cambio {b} -> {a}")
    return {"pair": {"before": b, "after": a}, "frames": frames, "change": "s1_change.webp", "delta_in_mask": {"vv": 0, "vh": 0}}


def s1_frames(cid, case, out):
    """Sentinel-1 RTC (banda C) alrededor del evento: imágenes VV/VH/RGB y cambio del par antes/después."""
    import importlib.util
    spec = importlib.util.spec_from_file_location("p3", Path(__file__).with_name("03_process.py"))
    P = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(P)
    files = sorted((WORK / cid / "s1").glob("*_s1p*.tif"))
    S = {}
    for f in files:
        d = f.stem.split("_")[0]
        with rasterio.open(f) as ds:
            S[f"{d[:4]}-{d[4:6]}-{d[6:]}"] = (P.lee_filter(ds.read(1)), P.lee_filter(ds.read(2)), int(f.stem.split("_s1p")[1]))
    vv_lim = P.stretch(np.concatenate([v[0][np.isfinite(v[0])] for v in S.values()]))
    vh_lim = P.stretch(np.concatenate([v[1][np.isfinite(v[1])] for v in S.values()]))
    frames = []
    for d in sorted(S):
        vv, vh, trk = S[d]
        t = f"{d.replace('-', '')}_p{trk}"
        P.gray_png(vv, out / f"s1vv_{t}.png", *vv_lim)
        P.gray_png(vh, out / f"s1vh_{t}.png", *vh_lim)
        P.rgb_png(vv, vh, out / f"s1rgb_{t}.png", (vv_lim, vh_lim, (2.0, 12.0)))
        frames.append({"date": d, "track": trk, "hh": f"s1vv_{t}.webp", "hv": f"s1vh_{t}.webp", "rgb": f"s1rgb_{t}.webp"})
    b, a = case["insar"]["s1_pair"]
    P.diverging_png(S[a][0] - S[b][0], out / "s1_change.png", span=4.0)
    print(f"[s1] {len(frames)} fechas Sentinel-1, cambio {b} -> {a}")
    return {"pair": {"before": b, "after": a}, "frames": frames, "change": "s1_change.webp", "delta_in_mask": {"vv": 0, "vh": 0}}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["extract", "process", "context", "all"])
    ap.add_argument("case", choices=[k for k, v in CASES.items() if "insar" in v])
    ap.add_argument("--track", type=int, help="extract: otra pasada para contrastar (no cambia el caso)")
    a = ap.parse_args()
    if a.cmd in ("extract", "all"):
        cmd_extract(a.case, a.track)
    if a.cmd in ("process", "all"):
        cmd_process(a.case)
    if a.cmd in ("context", "all"):
        cmd_context(a.case)


if __name__ == "__main__":
    main()
