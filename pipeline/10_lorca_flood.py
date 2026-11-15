"""Descarga la cartografía fluvial T100 del SNCZI para el bbox de Lorca."""
import json
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

root = Path(__file__).resolve().parents[1]
path = root / 'web/public/data/lorca'
manifest = json.loads((path / 'manifest.json').read_text())
params = {'service': 'WMS', 'version': '1.1.1', 'request': 'GetMap',
          'layers': 'Zi_laminas_q100', 'styles': '', 'srs': 'EPSG:4326',
          'bbox': ','.join(map(str, manifest['bbox'])), 'width': 1200, 'height': 764,
          'format': 'image/png', 'transparent': 'true'}
url = 'https://gis.miteco.gob.es/geoserver/agua/Zi_laminas_q100/wms?' + urlencode(params)
with urlopen(url, timeout=60) as response:
    data = response.read()
if not data.startswith(b'\x89PNG\r\n\x1a\n'):
    raise ValueError('El servicio no devolvió una imagen PNG; no se ha modificado la capa.')
(path / 'flood-t100.png').write_bytes(data)
print(url)
