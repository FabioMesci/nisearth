"""Genera datos de PRUEBA con el mismo formato que producirá 05_export.py.

Sirve para desarrollar la web sin esperar a los datos NISAR reales.
Uso: python pipeline/make_mock.py
"""
import json
from datetime import date, timedelta

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

from config import CASES, WEB_DATA

rng = np.random.default_rng(0)


def to_png(arr, path, vmin, vmax, alpha=None):
    g = np.clip((arr - vmin) / (vmax - vmin), 0, 1)
    rgb = (np.stack([g, g, g], -1) * 255).astype("uint8")
    a = np.full(g.shape, 255, "uint8") if alpha is None else alpha
    Image.fromarray(np.dstack([rgb, a]), "RGBA").save(path, optimize=True)


def main():
    index = []
    for cid, case in CASES.items():
        out = WEB_DATA / cid
        out.mkdir(parents=True, exist_ok=True)
        lon0, lat0, lon1, lat1 = case["bbox"]
        h, w = 400, 500
        yy, xx = np.mgrid[0:h, 0:w]
        blob = np.exp(-(((xx - w * 0.55) / (w * 0.15)) ** 2 + ((yy - h * 0.5) / (h * 0.2)) ** 2))

        start = date(2026, 6, 18)
        dates = [start + timedelta(days=12 * i) for i in range(12)]
        ev = date.fromisoformat(case["event"])
        frames, s_hh, s_hv = [], [], []
        for d in dates:
            after = d > ev
            base = gaussian_filter(rng.normal(-12, 3, (h, w)), 2)
            hh = base - (10 * blob if (after and case["kind"] == "flood") else 0)
            hv = base - 7 - (6 * blob if (after and case["kind"] == "fire") else 0)
            tag = d.strftime("%Y%m%d")
            to_png(hh, out / f"hh_{tag}.png", -25, 0)
            to_png(hv, out / f"hv_{tag}.png", -30, -5)
            frames.append({"date": d.isoformat(), "track": case["track"],
                           "hh": f"hh_{tag}.png", "hv": f"hv_{tag}.png"})
            s_hh.append(round(float(hh[blob > 0.5].mean()), 2))
            s_hv.append(round(float(hv[blob > 0.5].mean()), 2))

        mask = (blob > 0.5).astype("uint8")
        color = (40, 140, 255) if case["kind"] == "flood" else (255, 80, 30)
        rgba = np.zeros((h, w, 4), "uint8")
        rgba[mask == 1] = (*color, 200)
        Image.fromarray(rgba, "RGBA").save(out / "mask.png")
        delta = -10 * blob + rng.normal(0, 1, (h, w))
        dn = np.clip((delta + 10) / 20, 0, 1)
        Image.fromarray((np.dstack([1 - dn, dn * 0.6, dn]) * 255).astype("uint8")).save(out / "change.png")

        manifest = {
            "id": cid,
            "title": case["title"],
            "kind": case["kind"],
            "event": case["event"],
            "mock": True,
            "bbox": [lon0, lat0, lon1, lat1],
            "center": [(lon0 + lon1) / 2, (lat0 + lat1) / 2],
            "coordinates": [[lon0, lat1], [lon1, lat1], [lon1, lat0], [lon0, lat0]],
            "pair": {"before": case["pair"][0], "after": case["pair"][1]},
            "frames": [f for f in frames],
            "layers": {"mask": "mask.png", "change": "change.png"},
            "series": {"dates": [d.isoformat() for d in dates], "hh": s_hh, "hv": s_hv},
            "metrics": (
                [{"id": "area", "label": "Superficie inundada", "value": 42.0, "unit": "km²"},
                 {"id": "rail", "label": "Vía férrea afectada", "value": 3.1, "unit": "km"},
                 {"id": "roads", "label": "Carreteras afectadas", "value": 27.0, "unit": "km"},
                 {"id": "pop", "label": "Población en zona inundada", "value": 12500, "unit": "hab."}]
                if case["kind"] == "flood" else
                [{"id": "area", "label": "Superficie quemada (radar)", "value": 31000, "unit": "ha"},
                 {"id": "effis", "label": "Coincidencia con EFFIS", "value": 82, "unit": "%"},
                 {"id": "forest", "label": "Bosque y matorral", "value": 74, "unit": "%"},
                 {"id": "hvdrop", "label": "Caída media de HV", "value": -4.8, "unit": "dB"}]
            ),
            "overlays": {},
        }
        # para fijar el par antes/después en los datos de prueba
        manifest["pair"] = {"before": frames[0]["date"], "after": frames[-1]["date"]}
        (out / "manifest.json").write_text(json.dumps(manifest, indent=1, ensure_ascii=False))
        index.append({"id": cid, "title": case["title"], "kind": case["kind"],
                      "center": manifest["center"], "event": case["event"]})
    (WEB_DATA / "index.json").write_text(json.dumps(index, indent=1, ensure_ascii=False))
    print("mock ok ->", WEB_DATA)


if __name__ == "__main__":
    main()
