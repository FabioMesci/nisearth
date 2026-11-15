"""Lorca T100 flood-risk screening using a limited subset of the Valencia model.

Inputs: official SNCZI WFS polygons, WorldPop 2020 and ESA WorldCover 2021.
Unlike Valencia, no roads, critical facilities, age structure or coping proxy are used.
Output: risk.geojson, risk.csv and a risk summary in the Lorca manifest.
"""
import csv
import datetime as dt
import importlib
import json
from urllib.parse import urlencode

import numpy as np
from rasterio.features import rasterize
from rasterio.transform import from_bounds
from rasterio.warp import Resampling
from PIL import Image
from config import CASES, RAW, WEB_DATA

base = importlib.import_module('07_risk')
case = CASES['lorca']
bbox = case['bbox']
out = WEB_DATA / 'lorca'
cache = RAW / 'risk' / 'lorca'
cache.mkdir(parents=True, exist_ok=True)
params = {'service': 'WFS', 'version': '1.0.0', 'request': 'GetFeature',
          'typeName': 'agua:Zi_laminas_q100', 'srsName': 'EPSG:4326',
          'bbox': ','.join(map(str, bbox)) + ',EPSG:4326', 'outputFormat': 'application/json'}
url = 'https://gis.miteco.gob.es/geoserver/agua/Zi_laminas_q100/wfs?' + urlencode(params)
ref_feats = base.load_geojson(base.fetch(url, cache / 't100.geojson'))
if not ref_feats:
    raise SystemExit('No se han obtenido polígonos T100; no se calcula el índice.')
img = Image.open(out / 'flood-t100.png')
fshape = (img.height, img.width)
ftr = from_bounds(*bbox, img.width, img.height)
lat0 = (bbox[1] + bbox[3]) / 2
ncol = round((bbox[2] - bbox[0]) / base.CELL_DEG)
nrow = round((bbox[3] - bbox[1]) / base.CELL_DEG)
cshape = (nrow, ncol)
ctr = from_bounds(*bbox, ncol, nrow)
cell_km2 = abs(ctr.a) * 111.320 * np.cos(np.radians(lat0)) * abs(ctr.e) * 110.570
avg = lambda a: base.to_grid(a, ftr, cshape, ctr, Resampling.average)
ref = rasterize([(f['geometry'], 1) for f in ref_feats if f.get('geometry')],
                out_shape=fshape, transform=ftr).astype(bool)
H = avg(ref)
wc = base.worldcover(fshape, ftr, bbox, cache / 'worldcover.npz')
if (wc > 0).mean() < .95:
    raise SystemExit('Cobertura WorldCover insuficiente; no se calcula el índice.')
lc = {name: avg(wc == code) for code, name in base.WC_CLASSES.items()}
land = avg(wc > 0)
pop_f, pop_tr = base.read_window(base.fetch(base.POP_URL, RAW / 'pop' / 'esp_ppp_2020_constrained.tif'), bbox, pad=.01)
pop = base.to_grid(pop_f, pop_tr, cshape, ctr, Resampling.sum)
if not np.isfinite(pop).all() or pop.sum() <= 0:
    raise SystemExit('Población no disponible; no se calcula el índice.')
e_parts = {'population': np.clip(np.log1p(pop / cell_km2) / np.log1p(base.POP_DENSITY_REF), 0, 1),
           'built': np.clip(lc['built'] / base.BUILT_REF, 0, 1),
           'land': np.clip(lc['crop'], 0, 1)}
e_weights = {k: base.EXPOSURE_W[k] for k in e_parts}
combine = lambda parts, w: sum(parts[k] * w[k] for k in w) / sum(w.values())
E = combine(e_parts, e_weights)
V = np.clip(sum(lc[k] * v for k, v in base.SUSCEPTIBILITY['flood'].items()) / np.maximum(land, 1e-9), 0, 1)
R = np.cbrt(H * E * V)
cls = base.classify(R)
keep = (H >= base.MIN_HAZARD) & (land > .05)
if not keep.any():
    raise SystemExit('Sin celdas con escenario T100; no se calcula el índice.')
# La sensibilidad solo varía los tres pesos disponibles de exposición; H y V son fijos.
rng = np.random.default_rng(42)
same = np.zeros(cshape)
pop_high = []
for _ in range(base.MC_RUNS):
    weights = {k: v * rng.uniform(1 - base.MC_SPREAD, 1 + base.MC_SPREAD) for k, v in e_weights.items()}
    c = base.classify(np.cbrt(H * combine(e_parts, weights) * V))
    same += c == cls
    pop_high.append(float(pop[keep & (c >= 3)].sum()))
stability = same / base.MC_RUNS
rows, features = [], []
for r, c in zip(*np.nonzero(keep)):
    x0, y1 = ctr.c + c * ctr.a, ctr.f + r * ctr.e
    x1, y0 = x0 + ctr.a, y1 + ctr.e
    lon, lat = (x0 + x1) / 2, (y0 + y1) / 2
    row = {'lon': round(float(lon), 4), 'lat': round(float(lat), 4),
           'risk': round(float(R[r, c]), 3), 'class': base.CLASS_NAMES[cls[r, c]],
           'hazard': round(float(H[r, c]), 3), 'exposure': round(float(E[r, c]), 3),
           'vulnerability': round(float(V[r, c]), 3), 'population': round(float(pop[r, c]), 1),
           'built_pct': round(float(100 * lc['built'][r, c]), 1),
           'cropland_pct': round(float(100 * lc['crop'][r, c]), 1),
           'stability': round(float(stability[r, c]), 2)}
    rows.append(row)
    props = {**row, 'cls': int(cls[r, c])}
    features.append({'type': 'Feature', 'geometry': {'type': 'Polygon', 'coordinates': [[[x0,y0],[x1,y0],[x1,y1],[x0,y1],[x0,y0]]]}, 'properties': props})
(out / 'risk.geojson').write_text(json.dumps({'type':'FeatureCollection', 'features':features}, separators=(',', ':')), encoding='utf-8')
with (out / 'risk.csv').open('w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=list(rows[0]), lineterminator='\n')
    writer.writeheader()
    writer.writerows(sorted(rows, key=lambda x: -x['risk']))
classes = [{'cls': name, 'cells': int((keep & (cls == i)).sum()),
            'area_ha': round(float((keep & (cls == i)).sum() * cell_km2 * 100)),
            'population': round(float(pop[keep & (cls == i)].sum()))} for i, name in enumerate(base.CLASS_NAMES)]
sig = keep & (cls >= 2)
mean = lambda a: round(float(a[sig].mean()), 2) if sig.any() else 0
high = keep & (cls >= 3)
top = sorted(rows, key=lambda x: -x['risk'])[:5]
manifest_path = out / 'manifest.json'
man = json.loads(manifest_path.read_text(encoding='utf-8'))
man['risk'] = {'scenario':'snczi_t100_limited', 'generated':dt.date.today().isoformat(),
    'model':'screening = (fraction T100 * exposure * physical susceptibility)^(1/3)',
    'cell_m':[round(abs(ctr.a)*111320*np.cos(np.radians(lat0))),round(abs(ctr.e)*110570)],
    'cells':int(keep.sum()), 'classes':classes, 'pop_high':round(float(pop[high].sum())),
    'pop_high_range':[round(float(np.percentile(pop_high, 5))), round(float(np.percentile(pop_high, 95)))],
    'components':{'hazard':mean(H), 'exposure':mean(E), 'vulnerability':mean(V)},
    'drivers':{'exposure':{k:mean(v) for k,v in e_parts.items()}, 'vulnerability':{'physical':mean(V)}},
    'hotspots':[{'place':f"{t['lat']:.4f}, {t['lon']:.4f}", **{k:t[k] for k in ('lon','lat','risk','class','population')}} for t in top],
    'stability':{'runs':base.MC_RUNS, 'spread_pct':round(100*base.MC_SPREAD), 'mean_pct':round(float(100*stability[keep].mean()))},
    'weights':{'exposure':e_weights, 'physical_susceptibility':base.SUSCEPTIBILITY['flood']},
    'sources':['MITECO SNCZI T100 fluvial (WFS, escenario modelado)', 'WorldPop 2020 población (100 m)', 'ESA WorldCover 2021 (10 m)'],
    'files':{'geojson':'risk.geojson', 'csv':'risk.csv'}}
man['overlays']['risk'] = 'risk.geojson'
manifest_path.write_text(json.dumps(man, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(f"[risk] {len(rows)} celdas; población en clase alta/muy alta: {man['risk']['pop_high']}")
