"""Paso 3: procesar los recortes y exportar todo lo que necesita la web.

Entrada:  data/work/<caso>/<YYYYMMDD>_p<pasada>.tif   (de 02_extract.py; bandas HH y HV en dB)
Salida:   web/public/data/<caso>/
            hh_<fecha>.png, hv_<fecha>.png, rgb_<fecha>.png   (una por fecha)
            change.png   (diferencia después - antes, en dB, paleta divergente)
            mask.png     (agua nueva / zona quemada, transparente)
            manifest.json
          data/work/<caso>/mask.tif   (máscara georreferenciada para 04_context.py)

Qué hace, en orden:
  1. Filtro de speckle (Lee) — el "granulado" típico del radar.
  2. Detección de cambio entre el par antes/después:
     - inundación: agua nueva = HH(después) por debajo del umbral de Otsu  Y  caída de HH ≥ 3 dB
     - incendio:   zona quemada = HV cae (> 0.6 dB) PERO HH no cae (< 1.2 dB), suavizado ~300 m.
                   El fuego elimina hojas y ramas (volumen -> HV) pero troncos y suelo siguen
                   devolviendo HH. La cosecha/arado cambia toda la superficie: caen HH y HV a la vez.
                   Umbrales calibrados con el perímetro EFFIS del incendio de Niebla (IoU 0.60).
  3. Limpieza morfológica y eliminación de manchas pequeñas.
  4. Serie temporal: HH y HV medios dentro de la máscara en todas las fechas.

Uso: python pipeline/03_process.py dana
"""
import argparse
import json
from pathlib import Path

import numpy as np
import rasterio
from PIL import Image
from scipy.ndimage import binary_closing, binary_opening, uniform_filter
from skimage.filters import threshold_otsu
from skimage.morphology import disk, remove_small_objects

from config import CASES, WEB_DATA, WORK


# ---------------------------------------------------------------- utilidades
MAX_W = 2000  # ancho máximo de las imágenes web


def save_web(arr_rgba: np.ndarray, path: Path):
    """Guarda en WebP con pérdida (el speckle del radar comprime muy mal en PNG)."""
    im = Image.fromarray(arr_rgba.astype("uint8"), "RGBA")
    if im.width > MAX_W:
        im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.Resampling.BOX)
    im.save(path.with_suffix(".webp"), "WEBP", quality=80, method=5)


def lee_filter(db: np.ndarray, size: int = 5) -> np.ndarray:
    """Filtro de Lee sobre potencia lineal (reduce el speckle conservando bordes)."""
    lin = np.where(np.isfinite(db), 10 ** (db / 10), np.nan)
    valid = np.isfinite(lin)
    x = np.where(valid, lin, 0)
    n = uniform_filter(valid.astype("float32"), size)
    mean = uniform_filter(x, size) / np.maximum(n, 1e-6)
    sq = uniform_filter(x * x, size) / np.maximum(n, 1e-6)
    var = np.maximum(sq - mean**2, 0)
    noise = np.nanmean(var / np.maximum(mean**2, 1e-12)) * mean**2  # varianza del speckle (multiplicativo)
    k = var / np.maximum(var + noise, 1e-12)
    out = mean + k * (x - mean)
    out[~valid] = np.nan
    with np.errstate(divide="ignore", invalid="ignore"):
        return 10 * np.log10(np.maximum(out, 1e-6)).astype("float32") * np.where(valid, 1, np.nan)


def gray_png(db, path, lo, hi):
    g = np.clip((db - lo) / (hi - lo), 0, 1)
    a = np.where(np.isfinite(db), 255, 0).astype("uint8")
    g8 = (np.nan_to_num(g) * 255).astype("uint8")
    save_web(np.dstack([g8, g8, g8, a]), path)


def rgb_png(hh, hv, path, lims):
    """Falso color clásico SAR: R=HH, G=HV, B=HH−HV (ratio)."""
    ratio = hh - hv
    chans = [np.clip((c - lo) / (hi - lo), 0, 1) for c, (lo, hi) in zip((hh, hv, ratio), lims)]
    a = np.where(np.isfinite(hh), 255, 0).astype("uint8")
    rgb = [(np.nan_to_num(c) * 255).astype("uint8") for c in chans]
    save_web(np.dstack([*rgb, a]), path)


def diverging_png(delta, path, span=6.0):
    """Azul = la señal baja; rojo = la señal sube. Transparente donde no hay cambio relevante."""
    t = np.clip(np.nan_to_num(delta) / span, -1, 1)
    r = np.where(t > 0, 255, 255 * (1 + t))
    g = 255 * (1 - np.abs(t)) * 0.85 + 40 * (t > 0)
    b = np.where(t < 0, 255, 255 * (1 - t))
    alpha = np.clip(np.abs(t) * 1.6, 0, 1) * 235
    alpha[~np.isfinite(delta)] = 0
    save_web(np.dstack([r, g, b, alpha]), path)


def mask_png(mask, path, color):
    rgba = np.zeros((*mask.shape, 4), "uint8")
    rgba[mask] = (*color, 210)
    im = Image.fromarray(rgba, "RGBA")
    if im.width > MAX_W:
        im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.Resampling.NEAREST)
    im.save(path, optimize=True)


def stretch(vals):
    """Rango de color centrado en la mediana: los tonos medios quedan en gris medio."""
    lo, med = np.percentile(vals, [2, 50])
    return (float(lo), float(2 * med - lo))


def smooth(x, k):
    """Media móvil k×k ignorando NaN."""
    v = np.isfinite(x)
    return uniform_filter(np.nan_to_num(x), k) / np.maximum(uniform_filter(v.astype("float32"), k), 1e-6)


def pixel_area_km2(bbox, shape):
    lon0, lat0, lon1, lat1 = bbox
    h, w = shape
    lat = np.deg2rad((lat0 + lat1) / 2)
    dx = (lon1 - lon0) / w * 111.320 * np.cos(lat)
    dy = (lat1 - lat0) / h * 110.574
    return dx * dy


def mean_db(db, mask):
    v = db[mask & np.isfinite(db)]
    return float(10 * np.log10(np.mean(10 ** (v / 10)))) if v.size else None


# ---------------------------------------------------------------- principal
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("case", choices=CASES)
    ap.add_argument("--all-tracks", action="store_true", help="usar todas las pasadas en la serie (por defecto solo la del par)")
    args = ap.parse_args()
    cid, case = args.case, CASES[args.case]

    src = WORK / cid
    files = sorted(src.glob("*_p*.tif"))
    if not args.all_tracks:
        files = [f for f in files if f.stem.endswith(f"_p{case['track']}")]
    if not files:
        raise SystemExit(f"No hay recortes en {src}. Ejecuta antes 02_extract.py {cid}")

    stack = {}
    profile = None
    for f in files:
        d = f.stem.split("_")[0]
        date = f"{d[:4]}-{d[4:6]}-{d[6:]}"
        with rasterio.open(f) as ds:
            profile = ds.profile
            hh, hv = ds.read(1), ds.read(2)
        stack[date] = (lee_filter(hh), lee_filter(hv))
        print(f"[lee] {date}")
    dates = sorted(stack)

    before, after = case["pair"]
    if before not in stack or after not in stack:
        raise SystemExit(f"Faltan las fechas del par {case['pair']} (hay: {dates})")
    hh_b, hv_b = stack[before]
    hh_a, hv_a = stack[after]
    d_hh, d_hv = hh_a - hh_b, hv_a - hv_b
    valid = np.isfinite(hh_a) & np.isfinite(hh_b)

    # ---- detección de cambio
    if case["kind"] == "flood":
        sample = hh_a[valid]
        thr = float(threshold_otsu(sample[(sample > -35) & (sample < 5)]))
        water_after = valid & (hh_a < thr)
        water_before = valid & (hh_b < thr)
        mask = water_after & (d_hh < -3)
        delta, color = d_hh, (40, 150, 255)
        extra = {"otsu_threshold_db": round(thr, 2),
                 "permanent_water_km2": None}
    else:
        s_hv_d, s_hh_d = smooth(d_hv, 15), smooth(d_hh, 15)
        mask = valid & (s_hv_d < -0.6) & (s_hh_d > -1.2)
        delta, color = d_hv, (255, 90, 30)
        extra = {"rule": "dHV<-0.6 & dHH>-1.2 (media 15x15)"}
    mask = binary_opening(mask, disk(1))
    mask = binary_closing(mask, disk(2))
    mask = remove_small_objects(mask, max_size=40 if case["kind"] == "flood" else 500)

    px_km2 = pixel_area_km2(case["bbox"], mask.shape)
    area_km2 = float(mask.sum() * px_km2)
    if case["kind"] == "flood":
        extra["permanent_water_km2"] = round(float((water_before & water_after).sum() * px_km2), 1)
    print(f"[mask] {mask.sum()} px = {area_km2:.1f} km²")

    # ---- exportación para la web
    out = WEB_DATA / cid
    out.mkdir(parents=True, exist_ok=True)
    for old in [*out.glob("*.png"), *out.glob("*.webp")]:
        old.unlink()
    all_hh = np.concatenate([stack[d][0][np.isfinite(stack[d][0])] for d in dates])
    all_hv = np.concatenate([stack[d][1][np.isfinite(stack[d][1])] for d in dates])
    hh_lim, hv_lim = stretch(all_hh), stretch(all_hv)
    ratio_lim = (2.0, 12.0)

    frames, s_hh, s_hv = [], [], []
    for d in dates:
        hh, hv = stack[d]
        tag = d.replace("-", "")
        gray_png(hh, out / f"hh_{tag}.png", *hh_lim)
        gray_png(hv, out / f"hv_{tag}.png", *hv_lim)
        rgb_png(hh, hv, out / f"rgb_{tag}.png", (hh_lim, hv_lim, ratio_lim))
        frames.append({"date": d, "track": case["track"], "hh": f"hh_{tag}.webp", "hv": f"hv_{tag}.webp", "rgb": f"rgb_{tag}.webp"})
        s_hh.append(round(mean_db(hh, mask) or np.nan, 2))
        s_hv.append(round(mean_db(hv, mask) or np.nan, 2))
    diverging_png(delta, out / "change.png")
    mask_png(mask, out / "mask.png", color)

    # máscara georreferenciada para el paso de contexto
    prof = {**profile, "count": 1, "dtype": "uint8", "nodata": 0}
    with rasterio.open(src / "mask.tif", "w", **prof) as dst:
        dst.write(mask.astype("uint8"), 1)

    lon0, lat0, lon1, lat1 = case["bbox"]
    mpath = out / "manifest.json"
    prev = json.loads(mpath.read_text()) if mpath.exists() else {}
    metrics = (
        [{"id": "area", "label": "Agua nueva detectada", "value": round(area_km2, 1), "unit": "km²"}]
        if case["kind"] == "flood" else
        [{"id": "area", "label": "Superficie quemada (radar)", "value": round(area_km2 * 100), "unit": "ha"},
         {"id": "hvdrop", "label": "Caída media de HV", "value": round(float(np.nanmean(d_hv[mask])), 1), "unit": "dB"}]
    )
    # conservar métricas añadidas por 04_context.py
    keep = [m for m in prev.get("metrics", []) if m["id"] not in {x["id"] for x in metrics} and not prev.get("mock")]
    manifest = {
        "id": cid,
        "title": case["title"],
        "kind": case["kind"],
        "event": case["event"],
        "mock": False,
        "bbox": [lon0, lat0, lon1, lat1],
        "center": [(lon0 + lon1) / 2, (lat0 + lat1) / 2],
        "coordinates": [[lon0, lat1], [lon1, lat1], [lon1, lat0], [lon0, lat0]],
        "pair": {"before": before, "after": after},
        "frames": frames,
        "layers": {"mask": "mask.png", "change": "change.webp"},
        "series": {"dates": dates, "hh": s_hh, "hv": s_hv},
        "metrics": metrics + keep,
        "overlays": prev.get("overlays", {}) if not prev.get("mock") else {},
        "stats": extra,
    }
    # conservar lo que añaden otros pasos (04_context, 05_external: firms, daily, …)
    if not prev.get("mock"):
        for k, v in prev.items():
            manifest.setdefault(k, v)

    # ---- Sentinel-1 (banda C), si existe: mismas rejilla y escalas de color propias
    s1_dir = src / "s1"
    s1_files = sorted(s1_dir.glob("*_s1p*.tif")) if s1_dir.exists() else []
    if s1_files and case.get("s1_pair"):
        # solo la pasada del par: misma geometría en toda la serie
        trk = case.get("s1_track") or next((f.stem.split("_s1p")[1] for f in s1_files if f.stem.startswith(case["s1_pair"][1].replace("-", ""))), None)
        s1_files = [f for f in s1_files if f.stem.endswith(f"_s1p{trk}")]
    if s1_files and case.get("s1_pair"):
        s1 = {}
        for f in s1_files:
            d = f.stem.split("_")[0]
            with rasterio.open(f) as ds:
                s1[f"{d[:4]}-{d[4:6]}-{d[6:]}"] = (lee_filter(ds.read(1)), lee_filter(ds.read(2)), f.stem.split("_s1p")[1])
        vv_all = np.concatenate([v[0][np.isfinite(v[0])] for v in s1.values()])
        vh_all = np.concatenate([v[1][np.isfinite(v[1])] for v in s1.values()])
        vv_lim, vh_lim = stretch(vv_all), stretch(vh_all)
        s1_frames = []
        for d in sorted(s1):
            vv, vh, trk = s1[d]
            tag = f"{d.replace('-', '')}_p{trk}"
            gray_png(vv, out / f"s1vv_{tag}.png", *vv_lim)
            gray_png(vh, out / f"s1vh_{tag}.png", *vh_lim)
            rgb_png(vv, vh, out / f"s1rgb_{tag}.png", (vv_lim, vh_lim, (2.0, 12.0)))
            s1_frames.append({"date": d, "track": int(trk), "hh": f"s1vv_{tag}.webp", "hv": f"s1vh_{tag}.webp", "rgb": f"s1rgb_{tag}.webp",
                              "mean_hh": round(mean_db(vv, mask) or np.nan, 2), "mean_hv": round(mean_db(vh, mask) or np.nan, 2)})
        b1, a1 = case["s1_pair"]
        if b1 in s1 and a1 in s1:
            d_vh = s1[a1][1] - s1[b1][1]
            d_vv = s1[a1][0] - s1[b1][0]
            diverging_png(d_vv if case["kind"] == "flood" else d_vh, out / "s1_change.png")
            manifest["s1"] = {"pair": {"before": b1, "after": a1}, "frames": s1_frames, "change": "s1_change.webp",
                              "delta_in_mask": {"vv": round(float(np.nanmean(d_vv[mask])), 2), "vh": round(float(np.nanmean(d_vh[mask])), 2)}}
            print(f"[s1] {len(s1_frames)} fechas; en la máscara ΔVV {manifest['s1']['delta_in_mask']['vv']} dB, ΔVH {manifest['s1']['delta_in_mask']['vh']} dB")
        manifest["nisar_delta_in_mask"] = {"hh": round(float(np.nanmean(d_hh[mask])), 2), "hv": round(float(np.nanmean(d_hv[mask])), 2)}

    mpath.write_text(json.dumps(manifest, indent=1, ensure_ascii=False))

    # índice de casos para el globo
    ipath = WEB_DATA / "index.json"
    index = json.loads(ipath.read_text()) if ipath.exists() else []
    index = [i for i in index if i["id"] != cid] + [
        {"id": cid, "title": case["title"], "kind": case["kind"], "center": manifest["center"], "event": case["event"]}]
    ipath.write_text(json.dumps(index, indent=1, ensure_ascii=False))
    print(f"[ok] {len(frames)} fechas exportadas -> {out}")


if __name__ == "__main__":
    main()
