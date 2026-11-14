"""Sentinel-1 (banda C) como segundo sensor: procesado RTC en HyP3 (ASF) y recorte a la rejilla común.

Las imágenes GRD de Sentinel-1 vienen sin corregir el relieve. HyP3 (servicio gratuito de ASF/NASA)
las convierte en gamma0 RTC, igual que el GCOV de NISAR, para poder compararlas.

Uso:
  python pipeline/s1_hyp3.py submit   # encarga los trabajos (tardan ~20-60 min en los servidores de ASF)
  python pipeline/s1_hyp3.py fetch    # espera, descarga y recorta -> data/work/<caso>/s1/<fecha>_s1p<pasada>.tif
Credenciales: EARTHDATA_TOKEN o EARTHDATA_USERNAME/PASSWORD en .env
"""
import os
import sys
import zipfile

import numpy as np
import rasterio
from hyp3_sdk import HyP3
from rasterio.warp import Resampling, reproject

from config import CASES, RAW, WORK, load_env

PROJECT = "spaceapps-sar-2026"

GRANULES = {
    "dana": [  # pasada 8 descendente y 30 ascendente, alrededor de la DANA (pico noche 18-19 oct)
        "S1D_IW_GRDH_1SDV_20261010T060933_20261010T060958_004949_009553_3BCC",
        "S1C_IW_GRDH_1SDV_20261016T060920_20261016T060945_009906_013C00_84A5",
        "S1D_IW_GRDH_1SDV_20261022T060933_20261022T060958_005124_009B58_10F3",
        "S1C_IW_GRDH_1SDV_20261028T060920_20261028T060945_010081_0141F5_B61C",
        "S1D_IW_GRDH_1SDV_20261011T175344_20261011T175409_004971_009615_B50D",
        "S1C_IW_GRDH_1SDV_20261017T175331_20261017T175356_009928_013CB0_01C0",
        "S1D_IW_GRDH_1SDV_20261023T175344_20261023T175409_005146_009C13_B766",
    ],
    "niebla": [  # pasada 52 descendente: mismas fechas que el par NISAR (21 jul / 26 ago)
        "S1D_IW_GRDH_1SDV_20260721T063429_20260721T063454_003768_006C2D_3658",
        "S1D_IW_GRDH_1SDV_20260802T063429_20260802T063454_003943_007249_8B60",
        "S1D_IW_GRDH_1SDV_20260814T063430_20260814T063455_004118_00785B_41E7",
        "S1D_IW_GRDH_1SDV_20260826T063431_20260826T063456_004293_007E78_848E",
        # pasada 147 ascendente, mismas fechas: por si cubre mejor el perímetro
        "S1C_IW_GRDH_1SDV_20260721T182605_20260721T182630_008645_011215_6195",
        "S1C_IW_GRDH_1SDV_20260826T182607_20260826T182632_009170_012378_FDC3",
    ],
}
PATHS = {"0609": 8, "1753": 30, "0634": 52, "1826": 147}  # hora de paso (HHMM) -> pasada relativa


def client() -> HyP3:
    load_env()
    if os.environ.get("EARTHDATA_TOKEN"):
        return HyP3(token=os.environ["EARTHDATA_TOKEN"])
    return HyP3(username=os.environ["EARTHDATA_USERNAME"], password=os.environ["EARTHDATA_PASSWORD"])


def submit():
    hyp3 = client()
    existing = {j.job_parameters["granules"][0] for j in hyp3.find_jobs(name=PROJECT)}
    for case, grans in GRANULES.items():
        for g in grans:
            if g in existing:
                print(f"[ya encargado] {g}")
                continue
            hyp3.submit_rtc_job(g, name=PROJECT, radiometry="gamma0", resolution=30, scale="power")
            print(f"[encargado] {case}: {g}")
    print("Créditos restantes:", hyp3.check_credits())


def grid(bbox):
    from importlib import import_module
    ex = import_module("02_extract")
    return ex.common_grid(bbox)


def clip_to_grid(tif, bbox):
    transform, w, h = grid(bbox)
    out = np.full((h, w), np.nan, "float32")
    with rasterio.open(tif) as src:
        arr = src.read(1).astype("float32")
        arr[(arr <= 0) | ~np.isfinite(arr)] = np.nan
        reproject(arr, out, src_transform=src.transform, src_crs=src.crs, dst_transform=transform,
                  dst_crs="EPSG:4326", src_nodata=np.nan, dst_nodata=np.nan, resampling=Resampling.average)
    with np.errstate(divide="ignore", invalid="ignore"):
        return 10 * np.log10(out)


def fetch():
    hyp3 = client()
    batch = hyp3.find_jobs(name=PROJECT)
    print(f"{len(batch)} trabajos; esperando a que terminen…", flush=True)
    batch = hyp3.watch(batch)
    dl = RAW / "s1"
    dl.mkdir(parents=True, exist_ok=True)
    for job in batch:
        if not job.succeeded():
            print(f"[falló] {job.job_parameters['granules'][0]}")
            continue
        gran = job.job_parameters["granules"][0]
        case = next(c for c, gs in GRANULES.items() if gran in gs)
        date = gran[17:25]
        path = PATHS.get(gran[26:30], 0)
        out = WORK / case / "s1" / f"{date}_s1p{path}.tif"
        if out.exists():
            print(f"[skip] {out.name}")
            continue
        zips = job.download_files(dl)
        z = zipfile.ZipFile(zips[0])
        vv = next(n for n in z.namelist() if n.endswith("_VV.tif"))
        vh = next(n for n in z.namelist() if n.endswith("_VH.tif"))
        z.extractall(dl, [vv, vh])
        bbox = CASES[case]["bbox"]
        data = np.stack([clip_to_grid(dl / vv, bbox), clip_to_grid(dl / vh, bbox)])
        out.parent.mkdir(parents=True, exist_ok=True)
        transform, w, h = grid(bbox)
        with rasterio.open(out, "w", driver="GTiff", width=w, height=h, count=2, dtype="float32",
                           crs="EPSG:4326", transform=transform, nodata=np.nan, compress="deflate") as dst:
            dst.write(data)
            dst.set_band_description(1, "VV_dB")
            dst.set_band_description(2, "VH_dB")
        print(f"[ok] {case} {out.name}  cobertura {100 * np.isfinite(data[0]).mean():.0f}%")
        (dl / vv).unlink(); (dl / vh).unlink(); zips[0].unlink()  # liberar espacio


if __name__ == "__main__":
    {"submit": submit, "fetch": fetch}[sys.argv[1] if len(sys.argv) > 1 else "submit"]()
