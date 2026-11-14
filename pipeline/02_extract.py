"""Paso 2: extraer solo el recorte de cada imagen NISAR GCOV (sin descargar el archivo completo).

Cada GCOV es un HDF5 de 1-2 GB con toda la escena (~240 km). Lo abrimos por HTTPS
(lectura por rangos de bytes, gracias a earthaccess + fsspec) y leemos solo las filas/columnas
que caen dentro del bbox del caso. Después lo reproyectamos a una rejilla común en lat/lon
(EPSG:4326) para que todas las fechas y pasadas se puedan comparar píxel a píxel.

Salida: data/work/<caso>/<YYYYMMDD>_p<pasada>.tif  (2 bandas: HH y HV en dB, gamma0 RTC)

Uso:
  python pipeline/02_extract.py dana            # todas las fechas del caso
  python pipeline/02_extract.py dana --pair     # solo el par antes/después (rápido)
  python pipeline/02_extract.py dana --inspect  # imprime la estructura del primer HDF5
Requiere credenciales Earthdata en el archivo .env del proyecto (ver .env.example).
"""
import argparse
import json
import sys

import earthaccess
import h5py
import numpy as np
import rasterio
from pyproj import Transformer
from rasterio.transform import from_bounds
from rasterio.warp import Resampling, reproject

from config import CASES, WORK, earthdata_login

RES_DEG = 0.0002  # ~20 m: resolución de la rejilla común
FREQ_CANDIDATES = ["frequencyA", "frequencyB"]


def find_grid_group(h5: h5py.File) -> h5py.Group:
    """Localiza el grupo .../GCOV/grids/frequencyA (robusto a pequeñas variaciones del formato)."""
    for band in ("LSAR", "SSAR"):
        for freq in FREQ_CANDIDATES:
            path = f"/science/{band}/GCOV/grids/{freq}"
            if path in h5 and "HHHH" in h5[path]:
                return h5[path]
    found = []
    h5.visit(lambda n: found.append(n) if n.endswith("HHHH") else None)
    if found:
        return h5[found[0].rsplit("/", 1)[0]]
    raise KeyError("No encuentro HHHH en el HDF5")


def read_epsg(grp: h5py.Group) -> int:
    proj = grp.get("projection")
    if proj is not None:
        for key in ("epsg_code", "epsg"):
            if key in proj.attrs:
                return int(np.squeeze(proj.attrs[key]))
        val = np.squeeze(proj[()])
        if np.issubdtype(np.asarray(val).dtype, np.integer):
            return int(val)
    raise KeyError("No encuentro el código EPSG de la proyección")


def inspect(h5: h5py.File):
    def show(name, obj):
        if isinstance(obj, h5py.Dataset) and "GCOV" in name:
            print(f"  {name}  {obj.shape} {obj.dtype}")
    h5.visititems(show)


def common_grid(bbox):
    lon0, lat0, lon1, lat1 = bbox
    width = int(round((lon1 - lon0) / RES_DEG))
    height = int(round((lat1 - lat0) / RES_DEG))
    return from_bounds(lon0, lat0, lon1, lat1, width, height), width, height


def extract(fobj, bbox) -> np.ndarray | None:
    """Devuelve array (2, H, W) con HH y HV en dB sobre la rejilla común, o None si no hay solape."""
    with h5py.File(fobj, "r") as h5:
        grp = find_grid_group(h5)
        epsg = read_epsg(grp)
        x = grp["xCoordinates"][:]
        y = grp["yCoordinates"][:]

        # bbox (lon/lat) -> coordenadas del producto (UTM / polar)
        tr = Transformer.from_crs(4326, epsg, always_xy=True)
        lon0, lat0, lon1, lat1 = bbox
        lons = np.linspace(lon0, lon1, 20)
        lats = np.linspace(lat0, lat1, 20)
        gx, gy = np.meshgrid(lons, lats)
        px, py = tr.transform(gx, gy)
        dx = abs(x[1] - x[0])
        margin = 10 * dx
        xmin, xmax = px.min() - margin, px.max() + margin
        ymin, ymax = py.min() - margin, py.max() + margin

        cols = np.where((x >= xmin) & (x <= xmax))[0]
        rows = np.where((y >= ymin) & (y <= ymax))[0]
        if cols.size < 10 or rows.size < 10:
            return None
        c0, c1 = cols.min(), cols.max() + 1
        r0, r1 = rows.min(), rows.max() + 1

        bands = []
        for pol in ("HHHH", "HVHV"):
            arr = grp[pol][r0:r1, c0:c1].astype("float32")
            arr[~np.isfinite(arr) | (arr <= 0)] = np.nan
            bands.append(arr)

        # transformación afín del recorte (coordenadas en el centro del píxel)
        dy = y[1] - y[0]  # normalmente negativo (norte -> sur)
        src_transform = rasterio.Affine(dx, 0, x[c0] - dx / 2, 0, dy, y[r0] - dy / 2)

    dst_transform, w, h = common_grid(bbox)
    out = np.full((2, h, w), np.nan, dtype="float32")
    for i, arr in enumerate(bands):
        # promediamos en potencia lineal (no en dB) y convertimos a dB al final
        reproject(
            arr, out[i],
            src_transform=src_transform, src_crs=f"EPSG:{epsg}",
            dst_transform=dst_transform, dst_crs="EPSG:4326",
            src_nodata=np.nan, dst_nodata=np.nan,
            resampling=Resampling.average,
        )
    with np.errstate(divide="ignore", invalid="ignore"):
        return 10 * np.log10(out)


def save_tif(path, data, bbox):
    transform, w, h = common_grid(bbox)
    with rasterio.open(
        path, "w", driver="GTiff", width=w, height=h, count=2, dtype="float32",
        crs="EPSG:4326", transform=transform, nodata=np.nan, compress="deflate",
    ) as dst:
        dst.write(data)
        dst.set_band_description(1, "HH_dB")
        dst.set_band_description(2, "HV_dB")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("case", choices=CASES)
    ap.add_argument("--pair", action="store_true", help="solo el par antes/después")
    ap.add_argument("--track", type=int, help="solo esta pasada")
    ap.add_argument("--inspect", action="store_true")
    args = ap.parse_args()

    case = CASES[args.case]
    granules = json.loads((WORK / f"{args.case}_granules.json").read_text())
    if args.pair:
        granules = [g for g in granules
                    if g["path"] == case["track"] and g["start"][:10] in case["pair"]]
    elif args.track:
        granules = [g for g in granules if g["path"] == args.track]

    outdir = WORK / args.case
    outdir.mkdir(parents=True, exist_ok=True)

    earthdata_login()

    # una misma fecha y pasada puede venir partida en varios tramos (frames): los unimos en mosaico
    groups: dict[str, list[dict]] = {}
    for g in granules:
        groups.setdefault(f"{g['start'][:10].replace('-', '')}_p{g['path']}", []).append(g)

    for tag, parts in groups.items():
        out = outdir / f"{tag}.tif"
        if out.exists():
            print(f"[skip] {tag}")
            continue
        mosaic = None
        for g in parts:
            print(f"[read] {tag} frame {g['frame']}  ({g['size_mb']} MB en origen)", flush=True)
            f = earthaccess.open([g["url"]])[0]
            if args.inspect:
                with h5py.File(f, "r") as h5:
                    inspect(h5)
                sys.exit(0)
            data = extract(f, case["bbox"])
            if data is None:
                continue
            mosaic = data if mosaic is None else np.where(np.isfinite(mosaic), mosaic, data)
        if mosaic is None or np.isnan(mosaic[0]).mean() > 0.95:
            print("   sin cobertura útil, omitido")
            continue
        save_tif(out, mosaic, case["bbox"])
        valid = 100 * (1 - np.isnan(mosaic[0]).mean())
        print(f"   ok -> {out.name}  cobertura {valid:.0f}%  HH mediana {np.nanmedian(mosaic[0]):.1f} dB")


if __name__ == "__main__":
    main()
