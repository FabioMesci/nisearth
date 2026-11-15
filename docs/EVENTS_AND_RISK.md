# Events and risk: how the project manages events, how they interact, and how risk is computed

This document explains three things:

1. how an **event** (a fire, a flood) is defined and moves through the pipeline to the web app;
2. how the **risk index** is computed from all the data the pipeline collects;
3. how events **interact** (one hazard triggering another) and what the project does about it.

The risk index is a screening tool. It ranks grid cells inside one event so that people can decide
where to look first. It is not a damage estimate and not a forecast.

---

## 1. Event management

### 1.1 What an event is

An event is one entry in `pipeline/config.py`:

| Field | Meaning |
|---|---|
| `kind` | Hazard type: `fire`, `flood`, `earthquake`, `landslide`, `volcano`, `subsidence`. The risk index runs for `fire`, `flood` (plus `change: "debris"`, a flash flood with sediment) and `subsidence`. |
| `iso3` | Country for WorldPop population and age data (default `ESP`). |
| `bbox` | Area of interest (lon/lat). Every raster of the event is resampled to one common grid over this box. |
| `event` | Date of the event. |
| `window` | Date range of the radar time series. |
| `pair` | The before and after NISAR dates used for change detection (same track, same geometry). |
| `track`, `s1_pair`, `s1_track` | Radar passes used (NISAR and Sentinel-1). |
| `ems` | Optional Copernicus EMS activation used as reference. |

### 1.2 Life cycle of an event

Each step reads the outputs of the previous ones and adds its results to `manifest.json`, the single
file the web app reads for an event.

| Step | Script | What it adds |
|---|---|---|
| 1 | `01_search.py` | List of NISAR scenes over the bbox. |
| 2 | `02_extract.py`, `s1_hyp3.py` | Radar backscatter (HH/HV, VV/VH) on the common grid. |
| 3 | `03_process.py` | Speckle filter, change detection, the **hazard mask**, time series, images. |
| 4 | `04_context.py` | Affected roads and railways (OpenStreetMap); validation against EFFIS or Copernicus EMS. |
| 5 | `05_external.py` | NASA FIRMS hotspots, Open-Meteo rainfall, live fire watch. |
| 6 | `06_exposure.py` | Land cover (ESA WorldCover) and population (WorldPop) under the mask. |
| 7 | `07_risk.py` | **Risk index** per grid cell, cascade screening, robustness test, CSV and GeoJSON exports. |

Step 7 only needs the published outputs of steps 3 to 5 (`mask.png`, the reference GeoJSON, the FIRMS
points) plus remote open data, so it can be rerun without the raw radar files.

### 1.3 How the sources are fused into one hazard footprint

No single source is trusted alone. Each pixel of the footprint gets an evidence weight:

| Evidence | Fire (Niebla) | Flood (DANA) |
|---|---|---|
| Radar mask **and** official reference agree | 1.0 | 1.0 |
| Official reference only (EFFIS perimeter, Copernicus EMS extent) | 0.7 | 1.0 |
| Radar only | 0.5, and only on natural vegetation | 1.0 |

Reasons for these choices:

- **Fire, reference only = 0.7.** EFFIS perimeters are generalised and contain unburned islands.
- **Fire, radar only = 0.5 on natural vegetation.** Step 6 showed that 73 % of radar detections outside
  the EFFIS perimeter are cropland, which is harvest, not fire. Those pixels are dropped.
- **Flood, reference only = 1.0.** No radar passed during the storm. Copernicus EMS mapped the water
  the day after the peak; NISAR, four days later, still saw only 5 % of it. For the flood the reference
  is the main source and the radar confirms the residual water.
- **Cases without an official reference** (Limpopo, Rasuwa, Lorca, Mexico City) use the radar
  footprint alone with weight 1.0.
- **Subsidence.** The footprint is the InSAR mask from `08_insar.py` (ground moving more than 2.5 times
  the background noise), restricted to ground that goes down. Uplift is not counted.

---

## 2. Risk computation

### 2.1 Formula

For every cell of a grid of about 440 × 555 m:

```
risk = (hazard × exposure × vulnerability) ^ (1/3)
```

Each factor is an index from 0 to 1. The geometric mean is the form used by the INFORM Risk Index
of the European Commission's Joint Research Centre. It keeps the multiplicative meaning (no hazard,
nothing exposed, or no vulnerability gives zero risk) while keeping the result on a readable 0 to 1 scale.

Classes: very low < 0.20 ≤ low < 0.35 ≤ medium < 0.50 ≤ high < 0.65 ≤ very high.

### 2.2 Hazard

```
direct  = (both + w_ref × reference_only + w_radar × radar_only) × intensity
hazard  = max(direct, 0.25 × edge)
```

- `both`, `reference_only`, `radar_only`: share of the cell covered by each evidence type (section 1.3).
- `intensity` (fires): 0.6 where NASA FIRMS saw no hotspot, rising to 1.0 at the 90th percentile of
  fire radiative power summed per cell. Floods use 1.0 because water depth is not observed.
- `edge`: decays linearly from 1 at the footprint border to 0 at 1000 m (fire: embers, smoke,
  evacuation of the wildland-urban interface) or 250 m (flood: the extent is uncertain because the
  peak was not observed). Cells outside the footprint never exceed a hazard of 0.25.
- **Debris flood** (Rasuwa): edge 300 m with weight 0.35, for bank erosion and deposits beside the
  scoured channel.
- **Subsidence** (Lorca, Mexico City): each sinking pixel is weighted by
  `max(rate / 20 cm/yr, gradient / 10 cm/yr per km)`, capped at 1. The rate is the cumulative InSAR
  displacement scaled to one year. The gradient is taken on the rate smoothed over about 500 m, because
  at the native 50 m it is mostly noise (outside the sinking zone its 90th percentile is about 4 cm/yr per
  km at 500 m). A gradient of 10 cm/yr per km is an angular distortion of 1/10,000 a year, which reaches
  the usual cracking limits for buildings within a few decades. Edge 500 m with weight 0.25.

### 2.3 Exposure

Weighted mean of five components:

| Component | Weight | Source | Scaling to 0-1 |
|---|---|---|---|
| Population | 0.40 | WorldPop 2020, 100 m | log scale, 5000 people/km² = 1 |
| Built-up area | 0.15 | ESA WorldCover 2021 | 50 % of the cell built = 1 |
| Roads and railways | 0.15 | OpenStreetMap (motorway to tertiary, rail) | 1.5 km per cell = 1, rail counts double |
| Critical facilities | 0.15 | OpenStreetMap (hospital, clinic, school, nursing home, fire station, police) | at least one = 1 |
| Land assets | 0.15 | ESA WorldCover | fire: share of forest and shrub; flood and debris flood: share of cropland; subsidence: not used (the other weights are rescaled) |

### 2.4 Vulnerability

Weighted mean of three components:

| Component | Weight | Source | Meaning |
|---|---|---|---|
| Physical | 0.40 | ESA WorldCover | How much each land cover suffers from this hazard (table below). |
| Social | 0.30 | WorldPop age structure 2020, 1 km | Share of people under 5 or over 65; 50 % = 1. |
| Coping capacity | 0.30 | OpenStreetMap | Straight-line distance to the nearest hospital (30 km = 1) and fire station (20 km = 1), averaged. |

Physical susceptibility coefficients (0 = unaffected, 1 = destroyed):

| Land cover | Fire | Flood | Debris flood | Subsidence |
|---|---|---|---|---|
| Tree | 0.9 | 0.3 | 0.6 | 0.1 |
| Shrub | 1.0 | 0.3 | 0.6 | 0.1 |
| Grass | 0.7 | 0.3 | 0.7 | 0.1 |
| Crop | 0.4 | 0.7 | 0.9 | 0.3 |
| Built-up | 0.6 | 0.9 | 1.0 | 1.0 |
| Bare | 0.05 | 0.2 | 0.3 | 0.1 |
| Wetland | 0.2 | 0.1 | 0.5 | 0.2 |
| Water | 0 | 0 | 0 | 0 |

### 2.5 Robustness test

All weights are expert choices, so the script checks how much the result depends on them. It runs
the model 300 times, each time moving every weight (evidence, edge, exposure, vulnerability) by a
random factor of up to ±25 %. Each cell gets a **stability** value: the share of runs in which it
keeps its class. The summary also reports the 5th to 95th percentile of the population living in
high and very high cells.

### 2.6 Outputs

| File | Content |
|---|---|
| `web/public/data/<case>/risk.geojson` | One polygon per cell with risk, class, the three factors and the underlying values. Shown as a map layer; click a cell to read it. |
| `web/public/data/<case>/risk.csv` | Same cells as a table, sorted by risk, for GIS or spreadsheet use. |
| `manifest.json` → `risk` | Summary shown in the side panel: classes, factor means, drivers, hotspots, cascade, stability, weights, sources. |

### 2.7 Results of the current run

| | Niebla fire | DANA flood |
|---|---|---|
| Cells with hazard | 3,677 | 224 |
| Medium risk | 39,733 ha, 18,268 people | 503 ha, 1,124 people |
| High risk | 220 ha, 197 people | 24 ha, 3 people |
| Very high risk | none | none |
| People in high cells, 5-95 % range | 190 to 2,853 | 0 to 3 |
| Mean hazard / exposure / vulnerability (medium and above) | 0.63 / 0.16 / 0.73 | 0.69 / 0.25 / 0.46 |
| Cells keeping their class under ±25 % weights | 94 % | 94 % |

How to read it:

- **Niebla.** The fire burned forest far from towns: hazard and vulnerability are high, exposure is
  low. Most people counted in medium cells live in the 1 km edge zone, not inside the burn. The wide
  range for high cells (190 to 2,853 people) shows that several town cells sit just below the high
  threshold: treat the high class as a lower bound.
- **DANA.** The mapped water lies mostly on cropland and marsh. The single high cell is not robust
  (it changes class in most runs). The main message for this event stays the observation gap, not the
  risk map.

Results for the cases added on 15 November 2026:

| | Limpopo flood | Rasuwa debris flood | Lorca subsidence | Mexico City subsidence |
|---|---|---|---|---|
| Cells with hazard | 3,443 | 201 | 1,189 | 2,706 |
| Medium risk | 11,877 ha, 17,070 people | 217 ha, 2,080 people | 122 ha, 555 people | 14,597 ha, 1.61 M people |
| High risk | 671 ha, 1,365 people | 27 ha, 790 people | none | 12,217 ha, 1.74 M people |
| Very high risk | none | none | none | 17,151 ha, 2.92 M people |
| People in high cells, 5-95 % range | 289 to 2,724 | 0 to 790 | 0 | 4.30 M to 4.73 M |
| Mean hazard / exposure / vulnerability (medium and above) | 0.73 / 0.22 / 0.54 | 0.36 / 0.48 / 0.43 | 0.36 / 0.42 / 0.37 | 0.55 / 0.86 / 0.47 |
| Highest-risk cells near | Macarretane, Chókwè | Uttargaya (Betrawati) | Lorca, Puerto Lumbreras | Aragón, Nezahualcóyotl |
| Cells keeping their class under ±25 % weights | 94 % | 97 % | 97 % | 91 % |

- **Limpopo.** New water covers 325 km² of floodplain, mostly cropland. Risk concentrates where the
  flood reaches the irrigation villages around Chókwè. Only 29 % of the high cells keep their class in
  at least 80 % of the runs: the 1,365 people are a central value inside a wide range.
- **Rasuwa.** The radar scars follow the river, but the people live on the terraces above it, so most
  cells are low. The one high cell at Uttargaya (the Trishuli–Bhote Koshi confluence) is not robust.
  The Chinese part of the valley (Gyirong) has no WorldPop data and counts zero people.
- **Lorca.** The fastest sinking (about −16 cm/yr) lies under irrigated orchards south-west of the town,
  so the risk stays medium at most. This is the expected result: Alto Guadalentín subsidence threatens
  wells, canals and farm buildings more than the town.
- **Mexico City.** The sinking lake bed is also the most densely populated part of the metropolis
  (Iztapalapa, Nezahualcóyotl, Aragón, Chalco). Exposure saturates and the result is robust: 4.3 to
  4.7 million people in high or very high cells whatever the weights.

Cases without a risk index, and why:

| Case | Reason |
|---|---|
| Krasheninnikov (Kamchatka) | No permanent population or infrastructure near the lava field: exposure is zero everywhere. |
| Granada, La Palma, Álora | NISAR saw no deformation above the noise, so there is no hazard footprint. |
| Venezuela (earthquake) | Coseismic displacement is not the hazard to people; shaking is. It needs the USGS ShakeMap as hazard. |
| Langtang Lirung | The hazard is the collapse runout downstream, which the pre-collapse InSAR does not map. Rasuwa covers it. |

---

## 3. Interaction between events

Hazards are not independent. One event changes the ground and prepares the next one. Three of the
project's own observations are interactions:

- **Fire, then rain.** On 7 September the radar signal over the Niebla burn scar jumped: rain on
  bare, burned soil. Burned slopes shed water and sediment that vegetation used to hold.
- **Rain, then slope failure.** In Gelida (January 2026) days of rain made a retaining wall fail onto
  a railway line.
- **Storm, then no observation.** During the DANA no radar passed for 4.5 days. An interaction
  between the event and the observing system, which limits every downstream product.

### 3.1 Interaction matrix

Rows trigger or worsen columns.

| Trigger ↓ / Effect → | Fire | Flood | Landslide | Subsidence |
|---|---|---|---|---|
| **Drought, heat** | drier fuel, larger fires | | | faster where groundwater is pumped |
| **Fire** | | more runoff from burned slopes, flash floods | debris flows on burned slopes | |
| **Heavy rain, flood** | | | saturated slopes fail; embankments and walls collapse | sinkholes, scour |
| **Earthquake** | ruptured gas and power lines | dam or levee damage, tsunami | co-seismic landslides | liquefaction, settlement |
| **Volcanic unrest** | lava and ash ignite vegetation | lahars, blocked rivers | flank collapse | caldera subsidence |
| **Subsidence** | | lower ground floods more often and deeper | | |

### 3.2 What the pipeline computes today

`07_risk.py` adds a **cascade** value (0 to 1) to every cell. It is a screening indicator: it shows
where the secondary hazard is physically plausible, not that it will happen.

| Event kind | Cascade | Formula | Current result |
|---|---|---|---|
| Fire | Post-fire runoff and erosion | direct hazard × slope factor (slope / 25°, capped at 1) | 14,576 ha burned on slopes steeper than 15°; 835 cells flagged, crossed by 11.2 km of main roads |
| Flood | Rain-triggered slope failure onto infrastructure | rain factor (event rain / 200 mm) × slope factor × network density | DANA: 78.6 mm of rain; 4 cells flagged, with 5.6 km of main roads and 0.8 km of railway. Limpopo: 342.6 mm (Open-Meteo ERA5, between the passes) on a plain, no cell flagged |
| Debris flood | Bank undercutting: landslides from the scoured banks onto the valley road | max(direct hazard, edge) × slope factor | 2,989 ha of slopes steeper than 15° within 300 m of the scars; 73 cells flagged, with 9.1 km of main roads |
| Subsidence | Sinking flat ground ponds more rainwater each year | direct hazard × flatness (1 below 2°, 0 above 5°) | Lorca: 1,392 ha sinking on flat ground, 1.6 km of roads in flagged cells. Mexico City: 35,399 ha, 1,908 km of main roads and 56 km of railway |

Slope comes from the Copernicus DEM GLO-30. It is a surface model, so tree canopy adds some noise
to slopes in forest.

### 3.3 How overlapping events should be handled

When two events share ground, the rules below keep the results consistent. The first is implemented
through the cascade value; the others are design rules for the next steps.

1. **The first event changes the vulnerability of the second.** A burned cell is more vulnerable to
   rain. Use the first event's cascade value as an added term in the second event's physical
   vulnerability.
2. **Exposure is counted once.** People and assets in a cell hit by two events are exposed to both,
   but must not be added twice in totals.
3. **Combined risk uses the complement rule.** For independent hazards in one cell:
   `combined = 1 − (1 − risk_a) × (1 − risk_b)`. It never exceeds 1 and never falls below the larger
   of the two.
4. **Time matters.** A cascade is only active while the cause lasts: one to three rainy seasons for a
   burn scar, days for saturated slopes. Each event keeps its date so that a later event can check
   which earlier footprints are still active.

---

## 4. Limits

- **Observed hazard, not probability.** The radar shows what happened. The index describes the
  impact pattern of one event. A forward-looking risk map would need return periods or
  susceptibility models.
- **Weights are expert choices.** They are listed in `07_risk.py` and in `manifest.json`. The
  robustness test shows how much they matter; it does not validate them.
- **No independent validation.** There is no damage dataset to compare with.
- **Population data are modelled** (WorldPop 2020) and do not include tourists or seasonal workers.
  This matters on the Valencia coast, where campsites were evacuated. Mozambique uses the UN-adjusted
  WorldPop series, the only constrained one published for that country.
- **InSAR measures along the line of sight.** Subsidence is treated as vertical motion. In Mexico City
  and Lorca horizontal motion is small, so the error is minor.
- **Social vulnerability is age only.** Income, disability, housing quality and language are not
  included. Municipal census data (INE) would improve it.
- **Coping capacity uses straight-line distance**, not travel time on the road network.
- **Flood depth is unknown.** Hazard is presence of water, not depth or flow speed.
- **The mask grid is read from `mask.png`** when `data/work/<case>/mask.tif` is missing. The two are
  the same grid.

---

## 5. Adding an event or a hazard

**New event of an existing kind**

1. Add an entry to `CASES` in `pipeline/config.py`.
2. Run steps 1 to 7 for the new id.
3. Add the editorial text in `web/src/content.ts`.

**New hazard kind** (earthquake, landslide, volcano, subsidence)

1. Produce a hazard mask in step 3. For deformation hazards this means InSAR products (NISAR GUNW)
   instead of backscatter change.
2. Add the kind to `HAZARD`, `SUSCEPTIBILITY` and `LAND_ASSET` in `07_risk.py`, with its reference
   source (for example the USGS ShakeMap for an earthquake).
3. Add its cascade rule (for an earthquake: shaking × slope for co-seismic landslides).
4. The web app already knows the six kinds (`web/src/hazards.ts`).

## 6. Reproduce

```bash
python -m venv .venv && .venv/bin/pip install numpy scipy rasterio shapely pillow requests
cd pipeline
../.venv/bin/python 07_risk.py niebla
../.venv/bin/python 07_risk.py dana
for c in mozambique nepal lorca cdmx; do ../.venv/bin/python 07_risk.py $c; done
```

Run `07_risk.py` after `03_process.py` / `08_insar.py`: they keep the `risk` block, but it goes stale
if the mask changes.

The first run downloads about 95 MB of open data into `data/raw/` (WorldPop population and age
structure) and reads WorldCover, the Copernicus DEM and OpenStreetMap over the network. Later runs
use the cache.
