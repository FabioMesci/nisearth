"""Paso 1: buscar imágenes NISAR GCOV que cubren cada caso.

Uso:  python pipeline/01_search.py
Salida: data/work/<caso>_granules.json  (lista de imágenes con fecha, pasada, URL)
"""
import json
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
    rows = []
    for r in results:
        p = r.properties
        rows.append({
            "scene": p.get("sceneName") or p.get("fileID"),
            "start": p["startTime"],
            "path": p.get("pathNumber"),
            "frame": p.get("frameNumber"),
            "direction": p.get("flightDirection"),
            "url": p.get("url"),
            "size_mb": round(sum(v.get("bytes", 0) for k, v in (p.get("bytes") or {}).items() if k.endswith(".h5")) / 1e6, 1),
            "browse": (p.get("browse") or [None])[0],
            "footprint": r.geometry,
        })
    rows.sort(key=lambda x: x["start"])
    return rows


def main():
    WORK.mkdir(parents=True, exist_ok=True)
    for name, case in CASES.items():
        rows = search_case(name, case)
        (WORK / f"{name}_granules.json").write_text(json.dumps(rows, indent=1))
        print(f"\n== {name}: {len(rows)} GCOV ==")
        for r in rows:
            print(f"  {r['start'][:16]}  path {r['path']:>3} {r['direction'][:4]}  frame {r['frame']}  {r['size_mb']} MB")


if __name__ == "__main__":
    main()
