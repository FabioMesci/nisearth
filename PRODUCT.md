# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Product

**NISEarth · lo que vio el radar / what the radar saw** (formerly «España desde el radar») — NASA Space Apps Challenge 2026, challenge "Dancing with the SARs". An interactive web app that uses NISAR (NASA-ISRO, L-band) and Sentinel-1 (ESA, C-band) radar to follow the surface changes left by two Spanish disasters of 2026:

- **Niebla (Huelva) wildfire, Aug 2026** — burn scar measured through the smoke (~32,000 ha, 89 % inside the official EFFIS perimeter). Physical rule: fire drops HV but not HH; harvest drops both.
- **DANA Adam, La Safor / Oliva (Valencia), Oct 2026** — what radar *didn't* see: no radar passed during the storm (4.5 days without data), and by the time NISAR returned the water had drained. Argument for coordinating radar constellations in emergencies.

Plus a "Vigilancia España" panel: active Iberian fires (NASA FIRMS) and the next NISAR pass over each.

## Users

Primary: **Space Apps judges**, watching a live, projected demo of ~3 minutes. The app must tell the two-case story fast and convincingly. Secondary (narrative, not primary user): forest managers, risk prevention and infrastructure teams named in each case's "who it helps" section.

## Flow

3D globe intro (globe.gl) → fly to a case → MapLibre detail view with side panel: before/after slider, animated time series, HH/HV/RGB polarisation, L/C band, masks, affected infrastructure (OpenStreetMap), EFFIS validation, charts. Guided "story" mode walks the cases. ES/EN.

## Constraints

- The 3D globe intro stays (confirmed by the user).
- Copy and figures come from the pipeline and `content.ts`; design work does not change them.
- Stack: Vite + TypeScript, globe.gl, MapLibre GL, Chart.js. Deployed on Vercel.
- Mock data is labelled as such in the UI.

## Open decisions

- Visual direction is a **refinement** of the incumbent dark map UI (requested 2026-11-14), not a replacement world.
