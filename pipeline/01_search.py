"""Paso 1: buscar imágenes NISAR GCOV que cubren cada caso.

Uso:  python pipeline/01_search.py [caso]
Salida: data/work/<caso>_granules.json  (lista de imágenes con fecha, pasada, URL)
"""
import json
import sys
import asf_search as asf
from shapely.geometry import box

from config import CASES, WORK


def search_case(name: str, case: dict) -> list[dict]:
    aoi = box(*case["bbox"]).wkt
    results = asf.search(
        platform="NISAR",
        processingLevel="GCOV",
        intersectsWith=aoi,
        start=case["window"][0],
        end=case["window"][1],
    )
    by_key: dict[tuple, dict] = {}
    for r in results:
        p = r.properties
        scene = p.get("sceneName") or p.get("fileID") or ""
        row = {
            "scene": scene,
            "start": p["startTime"],
            "path": p.get("pathNumber"),
            "frame": p.get("frameNumber"),
            "direction": p.get("flightDirection"),
            "url": p.get("url"),
            "size_mb": round(sum(v.get("bytes", 0) for k, v in (p.get("bytes") or {}).items() if k.endswith(".h5")) / 1e6, 1),
            "browse": (p.get("browse") or [None])[0],
            "footprint": r.geometry,
        }
        key = (row["start"][:10], row["path"], row["frame"])
        prev = by_key.get(key)
        # Preferir CRID de producción (_P0...) frente a experimental (_X0...)
        if prev is None or ("_P0" in scene and "_P0" not in prev["scene"]):
            by_key[key] = row
    rows = list(by_key.values())
    rows.sort(key=lambda x: (x["start"], x["path"] or 0, x["frame"] or 0))
    return rows


def main():
    WORK.mkdir(parents=True, exist_ok=True)
    targets = sys.argv[1:] or list(CASES.keys())
    for name in targets:
        case = CASES[name]
        rows = search_case(name, case)
        (WORK / f"{name}_granules.json").write_text(json.dumps(rows, indent=1))
        print(f"\n== {name}: {len(rows)} GCOV ==")
        for r in rows:
            print(f"  {r['start'][:16]}  path {r['path']:>3} {r['direction'][:4]}  frame {r['frame']}  {r['size_mb']} MB")


if __name__ == "__main__":
    main()
