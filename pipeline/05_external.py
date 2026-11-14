"""Paso 5: datos externos de contexto (sin radar).

- Incendio: focos térmicos NASA FIRMS (VIIRS 375 m, satélites S-NPP, NOAA-20, NOAA-21) durante el fuego.
  Se cruzan con la máscara de radar: ¿qué % de focos cae dentro de la cicatriz que mide NISAR?
- Inundación: lluvia diaria de Open-Meteo (reanálisis ERA5) en el punto del caso, entre las pasadas NISAR.
- watch: incendios activos en la Península (FIRMS, últimos 5 días) agrupados por fuego, y para cada uno
  la próxima pasada NISAR prevista (ciclo de 12 días de cada pista, con huellas reales de ASF).

Necesita FIRMS_MAP_KEY en .env (gratis: https://firms.modaps.eosdis.nasa.gov/api/map_key/).
Salida: web/public/data/<caso>/firms.geojson + "daily"/"firms" en manifest.json; web/public/data/live/watch.json

Uso: python pipeline/05_external.py niebla | dana | watch
"""
import argparse
import csv
import io
import json
import math
import os
from datetime import date, datetime, timedelta, timezone
from urllib.request import urlopen

import numpy as np
import rasterio
from scipy.ndimage import binary_dilation

from config import CASES, RAW, WEB_DATA, WORK, load_env

FIRMS = "https://firms.modaps.eosdis.nasa.gov/api/area/csv/{key}/{src}/{area}/{days}/{day}"
VIIRS = ("VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT")

# ventana del incendio y punto de lluvia por caso
EXTRA = {
    "niebla": {"fire_window": ("2026-08-04", "2026-08-18")},
    "dana": {"rain_point": (38.92, -0.12, "Oliva"), "rain_window": ("2026-10-08", "2026-10-26")},
}


def key():
    load_env()
    k = os.environ.get("FIRMS_MAP_KEY")
    if not k:
        raise SystemExit("Falta FIRMS_MAP_KEY en .env")
    return k


def firms_csv(src, area, day, days):
    url = FIRMS.format(key=key(), src=src, area=area, days=days, day=day)
    txt = urlopen(url, timeout=120).read().decode()
    if not txt.startswith("latitude"):
        raise RuntimeError(f"FIRMS {src}: {txt[:200]}")
    return list(csv.DictReader(io.StringIO(txt)))


def fire(cid):
    case, (d0, d1) = CASES[cid], EXTRA[cid]["fire_window"]
    area = ",".join(str(v) for v in case["bbox"])
    cache = RAW / "firms" / f"{cid}.json"
    if cache.exists():
        rows = json.loads(cache.read_text())
    else:
        rows, day = [], date.fromisoformat(d0)
        while day <= date.fromisoformat(d1):  # la API admite como mucho 5 días por consulta
            n = min(5, (date.fromisoformat(d1) - day).days + 1)
            for src in VIIRS:
                rows += [{**r, "src": src} for r in firms_csv(src, area, day.isoformat(), n)]
            day += timedelta(days=n)
        cache.parent.mkdir(parents=True, exist_ok=True)
        cache.write_text(json.dumps(rows))
    rows = [r for r in rows if r["confidence"] != "l"]  # descartar baja confianza
    print(f"[firms] {len(rows)} focos VIIRS {d0} → {d1}")

    # ¿cuántos focos caen dentro de la cicatriz de radar? (margen de 1 píxel VIIRS ≈ 375 m)
    with rasterio.open(WORK / cid / "mask.tif") as ds:
        m = ds.read(1).astype(bool)
        px = abs(ds.transform.a) * 111_000 * math.cos(math.radians(case["bbox"][1]))
        m = binary_dilation(m, iterations=max(1, round(375 / px)))
        inside = 0
        for r in rows:
            i, j = ds.index(float(r["longitude"]), float(r["latitude"]))
            r["in"] = 0 <= i < m.shape[0] and 0 <= j < m.shape[1] and bool(m[i, j])
            inside += r["in"]
    pct = round(100 * inside / max(len(rows), 1))
    print(f"[firms] {pct}% de los focos dentro de la zona quemada por radar")

    feats = [{
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [round(float(r["longitude"]), 5), round(float(r["latitude"]), 5)]},
        "properties": {"date": r["acq_date"], "t": r["acq_time"], "frp": float(r["frp"]), "sat": r["satellite"]},
    } for r in sorted(rows, key=lambda r: (r["acq_date"], r["acq_time"]))]
    out = WEB_DATA / cid
    (out / "firms.geojson").write_text(json.dumps({"type": "FeatureCollection", "features": feats}, separators=(",", ":")))

    days = sorted({r["acq_date"] for r in rows})
    counts = [sum(r["acq_date"] == d for r in rows) for d in days]
    mpath = out / "manifest.json"
    man = json.loads(mpath.read_text())
    man["overlays"] = {**man.get("overlays", {}), "firms": "firms.geojson"}
    man["firms"] = {"from": days[0], "to": days[-1], "count": len(rows), "in_mask_pct": pct}
    man["daily"] = {"kind": "firms", "dates": days, "values": counts, "unit": "focos", "source": "NASA FIRMS VIIRS 375 m"}
    man["metrics"] = [x for x in man["metrics"] if x["id"] not in ("firms", "firms_in")] + [
        {"id": "firms_in", "label": "Focos FIRMS dentro de la zona quemada (radar)", "value": pct, "unit": "%"},
    ]
    mpath.write_text(json.dumps(man, indent=1, ensure_ascii=False))
    print(f"[ok] {mpath}")


def rain(cid):
    lat, lon, place = EXTRA[cid]["rain_point"]
    d0, d1 = EXTRA[cid]["rain_window"]
    url = (f"https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lon}"
           f"&start_date={d0}&end_date={d1}&daily=precipitation_sum&hourly=precipitation&timezone=Europe/Madrid")
    js = json.loads(urlopen(url, timeout=60).read())
    days, mm = js["daily"]["time"], [round(v or 0, 1) for v in js["daily"]["precipitation_sum"]]
    hourly = js["hourly"]["precipitation"]
    peak = max(range(len(hourly)), key=lambda i: hourly[i] or 0)
    total = round(sum(mm), 1)
    print(f"[rain] {place}: {total} mm en {d0}→{d1}; máximo horario {hourly[peak]} mm a las {js['hourly']['time'][peak]}")
    for d, v in zip(days, mm):
        print(f"   {d}  {v:6.1f} mm")

    pair = CASES[cid]["pair"]
    storm = round(sum(v for d, v in zip(days, mm) if pair[0] < d < pair[1]), 1)
    mpath = WEB_DATA / cid / "manifest.json"
    man = json.loads(mpath.read_text())
    man["daily"] = {"kind": "rain", "dates": days, "values": mm, "unit": "mm", "place": place,
                    "source": "Open-Meteo (reanálisis ERA5)", "peak_hour_mm": hourly[peak], "peak_hour": js["hourly"]["time"][peak]}
    man["metrics"] = [x for x in man["metrics"] if x["id"] != "rain"] + [
        {"id": "rain", "label": f"Lluvia entre las dos pasadas NISAR ({place})", "value": storm, "unit": "mm"},
    ]
    mpath.write_text(json.dumps(man, indent=1, ensure_ascii=False))
    print(f"[ok] {storm} mm entre {pair[0]} y {pair[1]} → {mpath}")


IBERIA = (-9.6, 35.9, 4.4, 43.9)
REPEAT = 12  # días: ciclo de repetición de NISAR


def nisar_tracks():
    """Pistas NISAR GCOV sobre la Península: huella (unión de frames) y última adquisición conocida."""
    import asf_search as asf
    from shapely.geometry import box, shape
    from shapely.ops import unary_union
    today = datetime.now(timezone.utc)
    res = asf.search(platform="NISAR", processingLevel="GCOV", intersectsWith=box(*IBERIA).wkt,
                     start=(today - timedelta(days=60)).date().isoformat(), end=today.date().isoformat())
    tracks = {}
    for r in res:
        p = r.properties
        k = (p["pathNumber"], p["flightDirection"])
        t = tracks.setdefault(k, {"geoms": {}, "last": ""})
        t["geoms"][p["frameNumber"]] = shape(r.geometry)
        t["last"] = max(t["last"], p["startTime"])
    out = []
    for (path, d), t in tracks.items():
        last = datetime.fromisoformat(t["last"].replace("Z", "+00:00"))
        nxt = last
        while nxt <= today:
            nxt += timedelta(days=REPEAT)
        geom = unary_union(list(t["geoms"].values())).intersection(box(*IBERIA)).simplify(0.02)
        out.append({"track": path, "dir": "asc" if d.startswith("A") else "desc", "last": last, "next": nxt, "geom": geom})
    print(f"[nisar] {len(out)} pistas sobre la Península (última adquisición publicada: {max(t['last'] for t in out):%d %b})")
    return out


def static_sources():
    """Fuentes de calor estáticas (refinerías, siderurgia, cementeras...) en la Península.
    El archivo estándar de FIRMS (SP) marca cada foco con `type`; 2 = fuente terrestre estática.
    Muestreamos 2 ventanas de 5 días al mes durante el último año disponible."""
    cache = RAW / "firms" / "static_iberia.json"
    if cache.exists():
        return json.loads(cache.read_text())
    area = ",".join(str(v) for v in IBERIA)
    pts = set()
    for src in ("VIIRS_NOAA20_SP", "VIIRS_SNPP_SP"):
        for m in range(12):
            for d in (1, 16):
                day = date(2025 + (7 + m) // 12, (7 + m) % 12 + 1, d)  # ago 2025 → jul 2026
                for r in firms_csv(src, area, day.isoformat(), 5):
                    if r.get("type") == "2":
                        pts.add((round(float(r["latitude"]), 3), round(float(r["longitude"]), 3)))
    pts = sorted(pts)
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(json.dumps(pts))
    print(f"[firms] {len(pts)} píxeles de fuentes estáticas (industria) en la Península")
    return pts


def near_static(g, static, km=1.5):
    for r in g:
        a, b = float(r["latitude"]), float(r["longitude"])
        for c, d in static:
            if abs(a - c) < 0.02 and math.hypot((a - c) * 111, (b - d) * 111 * math.cos(math.radians(a))) < km:
                return True
    return False


def cluster(rows, km=2.5):
    """Agrupa focos a menos de `km` km (unión-búsqueda): cada grupo ≈ un incendio."""
    pts = [(float(r["latitude"]), float(r["longitude"])) for r in rows]
    parent = list(range(len(pts)))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i
    for i, (a, b) in enumerate(pts):
        for j in range(i + 1, len(pts)):
            c, d = pts[j]
            if abs(a - c) < 0.05 and math.hypot((a - c) * 111, (b - d) * 111 * math.cos(math.radians(a))) < km:
                parent[find(i)] = find(j)
    groups = {}
    for i in range(len(pts)):
        groups.setdefault(find(i), []).append(rows[i])
    return list(groups.values())


def place_name(lat, lon):
    """Municipio más cercano (OpenStreetMap Nominatim, 1 petición/s)."""
    import time
    from urllib.request import Request
    url = f"https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&accept-language=es&lat={lat}&lon={lon}"
    try:
        time.sleep(1.1)
        a = json.loads(urlopen(Request(url, headers={"User-Agent": "space-apps-sar-demo/1.0"}), timeout=20).read()).get("address", {})
        town = a.get("city") or a.get("town") or a.get("village") or a.get("municipality") or a.get("county") or ""
        region = a.get("province") or a.get("state") or a.get("country") or ""
        return town, region, a.get("country_code", "").upper()
    except Exception:
        return "", "", ""


def watch():
    from shapely.geometry import Point, mapping
    area = ",".join(str(v) for v in IBERIA)
    start = (datetime.now(timezone.utc).date() - timedelta(days=4)).isoformat()  # la fecha es el INICIO del rango
    rows = []
    for src in ("VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT", "VIIRS_SNPP_NRT"):
        try:
            rows += [r for r in firms_csv(src, area, start, 5) if r["confidence"] != "l"]
        except RuntimeError as e:
            print("  ", e)
    print(f"[firms] {len(rows)} focos en la Península (últimos 5 días)")
    tracks = nisar_tracks()

    static = static_sources()
    fires, n_ind = [], 0
    for g in cluster(rows):
        if len(g) < 3:  # 1-2 píxeles sueltos: quemas agrícolas pequeñas o ruido
            continue
        if near_static(g, static):  # refinería, acería, cementera...: calor, pero no incendio
            n_ind += 1
            continue
        lat = sum(float(r["latitude"]) for r in g) / len(g)
        lon = sum(float(r["longitude"]) for r in g) / len(g)
        over = sorted((t for t in tracks if t["geom"].contains(Point(lon, lat))), key=lambda t: t["next"])
        times = sorted(f"{r['acq_date']}T{int(r['acq_time']):04d}" for r in g)
        fires.append({
            "lat": round(lat, 4), "lng": round(lon, 4), "n": len(g), "frp": round(sum(float(r["frp"] or 0) for r in g)),
            "first": f"{times[0][:13]}:{times[0][13:]}Z", "last": f"{times[-1][:13]}:{times[-1][13:]}Z",
            "pts": [[round(float(r["longitude"]), 4), round(float(r["latitude"]), 4)] for r in g],
            "passes": [{"track": t["track"], "dir": t["dir"], "next": t["next"].isoformat(timespec="minutes")} for t in over[:3]],
        })
    print(f"[filtro] {n_ind} grupos descartados por estar sobre fuentes industriales conocidas")
    fires.sort(key=lambda f: -f["frp"])
    for f in fires[:40]:
        f["town"], f["region"], f["cc"] = place_name(f["lat"], f["lng"])
    fires = [f for f in fires[:40] if f["cc"] in ("ES", "PT", "AD")][:15]  # fuera el norte de África
    for f in fires:
        nx = f["passes"][0] if f["passes"] else None
        print(f"  {f['town'] or '?':<24} {f['region']:<20} {f['n']:>3} focos  {f['frp']:>5} MW  "
              f"→ NISAR {nx['next'][:16] + ' pista ' + str(nx['track']) + ' ' + nx['dir'] if nx else 'sin cobertura'}")

    used = {(p["track"], p["dir"]) for f in fires for p in f["passes"]}
    out = WEB_DATA / "live"
    out.mkdir(exist_ok=True)
    (out / "firms_24h.json").unlink(missing_ok=True)
    data = {
        "generated": datetime.now(timezone.utc).isoformat(timespec="minutes"),
        "repeat_days": REPEAT,
        "hotspots": len(rows),
        "industrial": n_ind,
        "tracks_total": len(tracks),
        "fires": fires,
        "tracks": [{"track": t["track"], "dir": t["dir"], "next": t["next"].isoformat(timespec="minutes"),
                    "geom": mapping(t["geom"])} for t in tracks if (t["track"], t["dir"]) in used],
    }
    (out / "watch.json").write_text(json.dumps(data, separators=(",", ":")))
    print(f"[ok] {len(fires)} incendios vigilados → {out / 'watch.json'}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("what", choices=[*CASES, "watch"])
    a = ap.parse_args()
    if a.what == "watch":
        watch()
    elif CASES[a.what]["kind"] == "fire":
        fire(a.what)
    else:
        rain(a.what)
