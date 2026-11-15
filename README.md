# Spain through radar · España desde el radar

**NASA Space Apps Challenge 2026 · Dancing with the SARs** · [Versión en español](README.es.md)

**Live app:** https://dancing-with-the-sars-spain.vercel.app (ES / EN toggle, top right)

> What did radar see in Spain's 2026 disasters, and what did it miss?

NISAR (NASA-ISRO, L-band) sees day and night, through clouds and smoke, and measures ground motion to the
centimetre. We took its first months of public data over Spain and followed six real 2026 events. Every number in
the app is produced by our own pipeline from NISAR and Sentinel-1 data and checked against independent references
(EFFIS, Copernicus EMS, NASA FIRMS, published subsidence rates). Where radar saw nothing, we say so and explain why.
The point is not only to show what the satellite can do. It is also to show where the gaps are, so that emergency
managers know when they can rely on it.

## The six cases in Spain

| Case | Technique | What radar shows |
|---|---|---|
| 🔥 **Niebla wildfire (Huelva), Aug 2026** | Backscatter change (HH/HV) | Burn scar measured through the smoke: **~32,100 ha**, **89 %** inside the official EFFIS perimeter, **94 %** of NASA FIRMS hotspots fall inside it. Physical rule: fire drops HV (canopy volume) but not HH; harvest drops both. 28,300 ha of forest, shrub and grass burned; 720 people live within 1 km of the edge. |
| ⬇️ **Alto Guadalentín subsidence (Lorca)** | InSAR, 8 chained NISAR GUNW pairs (Jun–Oct) | The valley floor sinks **6 cm in 108 days** (~**16 cm/yr**, linear fit; noise ±1.2 cm), in line with the published maxima of 10–16 cm/yr. A real detection. |
| 🌋 **Tajogaite lava flow (La Palma)** | InSAR, 9 interferograms | The 2021 flow moves **~0.4 cm** relative to its surroundings, below the noise (±1.7 cm): it has almost stopped settling. The lava is very coherent (0.86). |
| 〰️ **Granada earthquake series (M5.2, 14 Aug)** | InSAR, 3 tracks | No deformation above ~1 cm. The two descending tracks disagree (+1.3 vs −0.2 cm): that is the atmosphere, not the earthquake. A useful upper bound. |
| ⛰️ **High-speed rail slope at Álora (4 Feb)** | InSAR + Sentinel-1 | NISAR had no data until June; Sentinel-1 passed the day before and 5 days after. Since June the repaired line moves **<1 mm** relative to its surroundings. |
| 💧 **Storm "Adam", La Safor (Valencia), Oct 2026** | Backscatter change + Copernicus EMS | What radar **did not** see: no radar passed during the storm (4.5 days without data). Three days after the optical map from Copernicus EMS, NISAR still saw only **5 %** of the 885 ha flooded. A case for coordinating radar constellations in emergencies. |

## NISAR around the world

The same pipeline, applied to five events abroad. For four of them NASA/JPL published its own NISAR image; the app shows it next to ours, with credit, so judges can compare (ours is processed independently from the same public ASF data).

| Case | Technique | What radar shows | NASA/JPL says |
|---|---|---|---|
| 〰️ **Venezuela earthquakes (M7.2 + M7.5, 24 Jun 2026)** | InSAR, 3 tracks (2 asc, 1 desc) | Up to **−59 cm** along the line of sight on the La Guaira coast. No ramp or height fit (deformation fills the scene); zero set inland. | ~60 cm westward next to the airport |
| 🌋 **Krasheninnikov volcano (Kamchatka)** | Backscatter change, 11 dates | New bright lobes at the NE front of the flow (13 Jul → 23 Sep); HH over them rises from −14 dB (Jun) to −4.5 dB (18 Aug), then levels off. Part of the flagged area is melting snow patches. | 17-frame time-lapse, Dec 2025 – Aug 2026 |
| 💧 **Limpopo floods (Mozambique, Jan 2026)** | Backscatter change, 4 dates | **325 km²** of new water between 5 and 17 Jan (threshold −14 dB at the histogram valley); 5.4 km of railway and 19 km of roads under water (OSM). | Before/after, >600,000 displaced |
| ⬇️ **Mexico City subsidence** | InSAR, 10 chained pairs (Oct–Feb) | ~37,500 ha of the old lakebed sink; **−22 cm in 120 days** at Chalco. Ramp and height fitted on the hills only (> 2,280 m). | > 2 cm/month |
| 🌊 **Rasuwa flash flood (Nepal, 26 Aug 2026)** | Backscatter change, 6 dates | Water gone by the next pass; **385 ha** of valley floor (within 300 m of OSM rivers) change by > 3 dB. Not validated. | — (no NASA image) |

## What the app does

A 3D globe (globe.gl / three.js) opens onto a detailed map (MapLibre) for each case, with:

- before/after slider and animated time series of radar images;
- polarisation (HH / HV / RGB) and band (NISAR L-band / Sentinel-1 C-band) selectors;
- change masks, cumulative InSAR displacement and coherence;
- affected roads and railways (OpenStreetMap), land cover and exposed population;
- validation against EFFIS, Copernicus EMS and NASA FIRMS;
- a risk index per grid cell for the fire and flood (hazard × exposure × vulnerability, [method](docs/EVENTS_AND_RISK.md));
- a "Spain watch" panel: active Iberian fires today (NASA FIRMS) and the next NISAR pass over each;
- a hazard guide (fire, flood, earthquake, landslide, volcano, subsidence): what each one looks like to radar;
- a guided story mode, and a full Spanish / English interface.

## Who it helps

Forest services and civil protection (burn scars through smoke, post-fire erosion risk), water authorities
(is pumping restriction slowing subsidence?), rail and road managers (slopes and embankments watched every 12 days),
seismologists and volcano observatories (upper bounds on deformation), and emergency coordinators (knowing *when*
radar will pass, and when it will not).

---

## Method

- **Data:** NISAR L2 GCOV (RTC gamma0, HH and HV, ~20 m) for fire and flood, one track per case so the geometry is
  constant (Niebla: track 23 descending; La Safor: track 167 descending). NISAR L2 GUNW (unwrapped interferograms,
  80 m) for ground motion. Sentinel-1 IW GRD processed to RTC gamma0 30 m with ASF HyP3.
- **Remote subsets:** GCOV and GUNW files are 1–2 GB each. We read only the area of interest over HTTPS, so the full
  pipeline runs on a laptop.
- **Speckle:** 5×5 Lee filter on linear power.
- **Fire:** smoothed change (15×15 px ≈ 300 m) between 21 Jul and 26 Aug: burned = ΔHV < −0.6 dB **and**
  ΔHH > −1.2 dB. Thresholds calibrated against the EFFIS perimeter of this fire (recall 65 %, precision 89 %,
  IoU 0.60). Without the HH condition precision drops to 57 %: harvested fields look like fire.
- **Flood:** new water = HH(after) < Otsu threshold **and** ΔHH < −3 dB.
- **InSAR:** GUNW interferograms of 12 days chained into a cumulative series (intermediate atmospheric delays cancel),
  ramp and DEM-correlated atmosphere removed while excluding the deforming area, sign convention −phase·λ/4π
  (positive = towards the satellite, verified on Lorca). The ionosphere correction shipped in the product *added*
  noise in these small scenes (4.7 cm vs 2.4 cm at Lorca), so it is off by default.
- **Infrastructure:** OpenStreetMap lines (`railway=rail`, main roads) inside the mask. For fires only the confirmed
  burned area (radar ∩ EFFIS) is counted.
- **Exposure:** ESA WorldCover 2021 (10 m) under the mask and WorldPop 2020 population (100 m).
  73 % of what radar flags outside EFFIS is cropland: harvest residue, the main source of false positives.
- **Flood validation:** Copernicus EMS (EMSR935) mapped 885 ha flooded on 20 Oct from SPOT/GeoEye.
  On 23 Oct NISAR saw only 5 % of that area as water: it had drained in three days.

## Limitations

- The fire thresholds were calibrated with EFFIS on the same event; that is not an independent validation.
- The post-storm NISAR image is 4 days after peak rain: the maximum flood was not observed. The other passes
  (tracks 66 desc. and 58 asc.) are from 16 Oct (before the rain) and 28 Oct (even later).
- We tested soaked soil as a signal (HH increase): ΔHH = +0.47 dB on cropland, within normal pass-to-pass variation
  (−0.9 to +1.1 dB). Not distinguishable, so not shown as a result.
- Only ~4 months of NISAR interferometry: only motion of centimetres per year stands out. Rates are linear fits over
  108 days, not long-term velocities.
- Population is a 100 m gridded estimate (WorldPop 2020), not a count of people affected.
- There are no public NISAR data over Spain between February and May 2026.

## Repository

```
pipeline/            Data processing (Python)
  config.py          Cases: area, dates, before/after pairs, tracks
  01_search.py       Finds NISAR GCOV scenes on ASF
  02_extract.py      Reads ONLY the subset of each 1–2 GB HDF5 over HTTPS onto a common grid
  s1_hyp3.py         Sentinel-1: RTC processing on ASF HyP3, cropped to the same grid
  03_process.py      Speckle filter, change detection, masks, time series, PNG + manifest.json
  04_context.py      OpenStreetMap roads and rail; validation with EFFIS / Copernicus EMS
  05_external.py     NASA FIRMS hotspots, Open-Meteo rain, "Spain watch" panel
  06_exposure.py     Land cover (ESA WorldCover) and population (WorldPop) under each mask
  07_risk.py         Risk index per grid cell, cascades, CSV/GeoJSON export
  08_insar.py        NISAR L2 GUNW interferometry: remote subset, ramp and atmosphere correction,
                     cumulative series, EMSC catalogue, lava flow and rail from OSM, Sentinel-1
  make_mock.py       Mock data in the same format (to develop the web without data)
web/                 App (Vite + TypeScript + globe.gl + MapLibre + Chart.js)
  public/data/       Pipeline output (all the web needs)
  src/content.ts     Narrative text for each case (ES / EN)
  src/i18n.ts        Interface strings (ES / EN)
docs/                EVENTS_AND_RISK.md: events, hazard interactions and the risk index
```

## Reproduce

### 1. Credentials
Free [NASA Earthdata](https://urs.earthdata.nasa.gov) account. Copy `.env.example` to `.env` and fill in
`EARTHDATA_TOKEN` (recommended) or username and password. For FIRMS hotspots add `FIRMS_MAP_KEY`.
`.env` is in `.gitignore`.

### 2. Pipeline
```bash
python3 -m venv .venv && .venv/bin/pip install -r pipeline/requirements.txt
cd pipeline
../.venv/bin/python 01_search.py                    # NISAR scenes per case
../.venv/bin/python 02_extract.py niebla --track 23 # time series (subset only, ~1 min per scene)
../.venv/bin/python 02_extract.py dana --track 167
../.venv/bin/python s1_hyp3.py submit               # Sentinel-1 (optional, ~30–60 min on ASF)
../.venv/bin/python s1_hyp3.py fetch
for c in niebla dana; do
  ../.venv/bin/python 03_process.py $c && ../.venv/bin/python 04_context.py $c \
  && ../.venv/bin/python 06_exposure.py $c && ../.venv/bin/python 05_external.py $c \
  && ../.venv/bin/python 07_risk.py $c
done
for c in granada lorca lapalma alora; do ../.venv/bin/python 08_insar.py all $c; done
# NISAR around the world / NISAR en el mundo
for c in venezuela cdmx; do ../.venv/bin/python 08_insar.py all $c; done
../.venv/bin/python 02_extract.py krasheninnikov --track 80 && ../.venv/bin/python 03_process.py krasheninnikov
../.venv/bin/python 02_extract.py mozambique --track 114 && ../.venv/bin/python 03_process.py mozambique && ../.venv/bin/python 04_context.py mozambique
../.venv/bin/python 02_extract.py nepal --track 98 && ../.venv/bin/python 03_process.py nepal
../.venv/bin/python 09_world.py                     # NASA/JPL image + "world" region (after processing)
../.venv/bin/python 05_external.py watch            # "Spain watch" panel: rerun right before a demo
```
(Álora also uses Sentinel-1: run `s1_hyp3.py submit` and `s1_hyp3.py fetch` before `08_insar.py context alora`.)

### 3. Web
```bash
cd web && npm install && npm run dev     # http://localhost:5173
npm run build                            # static site in web/dist
```

## Data sources

- NISAR L2 GCOV and GUNW — NASA/JPL-Caltech & ISRO, distributed by [ASF DAAC](https://search.asf.alaska.edu)
- Sentinel-1 — Copernicus/ESA, processed with [ASF HyP3](https://hyp3-docs.asf.alaska.edu)
- Fire perimeters — [EFFIS](https://effis.jrc.ec.europa.eu)
- Storm flood map — [Copernicus EMS Rapid Mapping EMSR935](https://rapidmapping.emergency.copernicus.eu/EMSR935)
- Earthquakes — [EMSC](https://www.emsc-csem.org) catalogue
- Land cover — [ESA WorldCover 2021](https://esa-worldcover.org) (CC BY 4.0)
- Population — [WorldPop](https://www.worldpop.org) 2020, Spain, 100 m constrained (CC BY 4.0)
- Active fires — [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov) (VIIRS) · Rain — [Open-Meteo](https://open-meteo.com) / ERA5
- Roads, railways and the 2021 lava flow — © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors (ODbL)
- Basemap — Esri World Imagery; globe textures — three-globe (NASA Blue Marble)

## License

MIT
