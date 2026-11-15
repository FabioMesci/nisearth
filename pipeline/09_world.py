"""Paso 9: NISAR en el mundo — imagen oficial de NASA/JPL junto a nuestro procesado.

Para cada caso con bloque "official" en config.py (región "world"):
  - descarga la imagen publicada por NASA/JPL (dominio público) y la guarda como official.webp
  - añade al manifest.json el bloque "official" (enlace, crédito, fecha, qué afirma NASA)
  - marca la región en el índice de casos (la web los agrupa aparte de los casos españoles)

Se ejecuta DESPUÉS de 03_process.py / 08_insar.py (que reescriben el manifest).

Uso:  python 09_world.py            # todos los casos del mundo
      python 09_world.py venezuela  # uno
"""
import argparse
import io
import json
import urllib.parse
import urllib.request

from PIL import Image

from config import CASES, WEB_DATA

UA = {"User-Agent": "nasa-space-apps-sar-pipeline"}
MAX_W = 1600


def fetch_image(url, dst):
    url = urllib.parse.quote(url, safe=":/?=&%")  # p. ej. el apóstrofo de "venezuela's-earthquakes"
    raw = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120).read()
    im = Image.open(io.BytesIO(raw)).convert("RGB")
    if im.width > MAX_W:
        im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.Resampling.LANCZOS)
    im.save(dst, "WEBP", quality=84, method=5)
    return im.size


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("case", nargs="?")
    a = ap.parse_args()
    ids = [a.case] if a.case else [k for k, v in CASES.items() if v.get("region") == "world"]
    idx_path = WEB_DATA / "index.json"
    idx = json.loads(idx_path.read_text())
    for cid in ids:
        case = CASES[cid]
        out = WEB_DATA / cid
        man_path = out / "manifest.json"
        if not man_path.exists():
            print(f"[skip] {cid}: sin manifest (procesa antes el caso)")
            continue
        man = json.loads(man_path.read_text())
        man["region"] = case.get("region", "es")
        off = dict(case["official"]) if case.get("official") else None  # sin imagen de NASA (p. ej. Nepal): solo la región
        if off and off.get("image"):
            dst = out / "official.webp"
            if not dst.exists():
                w, h = fetch_image(off["image"], dst)
                print(f"[img] {cid}: {w}x{h}")
            off["file"] = "official.webp"
            off["source_image"] = off.pop("image")
        if off:
            man["official"] = off
        man_path.write_text(json.dumps(man, ensure_ascii=False, indent=1))
        for c in idx:
            if c["id"] == cid:
                c["region"] = case.get("region", "es")
        print(f"[ok] {cid}")
    idx_path.write_text(json.dumps(idx, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
