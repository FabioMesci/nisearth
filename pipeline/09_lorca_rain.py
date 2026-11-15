"""Download the Lorca ERA5 daily precipitation series used by the web demo."""
import json
from datetime import date, timedelta
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / 'web/public/data/lorca/manifest.json').read_text())
params = {'latitude': 37.605, 'longitude': -1.608, 'start_date': manifest['insar']['start'],
          'end_date': manifest['insar']['end'], 'daily': 'precipitation_sum',
          'models': 'era5', 'timezone': 'Europe/Madrid'}
url = 'https://archive-api.open-meteo.com/v1/archive?' + urlencode(params)
with urlopen(url, timeout=60) as response:
    data = json.load(response)
dates, values = data['daily']['time'], data['daily']['precipitation_sum']
expected = (date.fromisoformat(params['end_date']) - date.fromisoformat(params['start_date'])).days + 1
assert data['daily_units']['precipitation_sum'] == 'mm' and len(dates) == len(values) == expected
assert dates == [(date.fromisoformat(params['start_date']) + timedelta(days=i)).isoformat() for i in range(expected)]
assert all(v is None or isinstance(v, (int, float)) and v >= 0 for v in values)
out = {'source': 'Open-Meteo Historical Weather API / ERA5', 'url': url,
       'retrieved': date.today().isoformat(), 'requested': [37.605, -1.608],
       'grid': [data['latitude'], data['longitude']], 'timezone': data['timezone'],
       'unit': 'mm', 'dates': dates, 'values': values}
path = ROOT / 'web/public/data/lorca/rain-era5.json'
path.write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n')
print(f'{path}: {len(dates)} daily values')
