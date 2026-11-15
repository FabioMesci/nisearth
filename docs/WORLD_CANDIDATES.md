# NISAR en el mundo — candidatos (verificados 15 nov 2026)

Criterio: evento de alto impacto, difundido por NASA/JPL con imagen NISAR, **y** con productos públicos en ASF (comprobado con `asf_search`, `dataset="NISAR"`).

| # | Caso | Tipo | Fuente oficial | Datos ASF públicos | Propuesta |
|---|------|------|----------------|--------------------|-----------|
| 1 | **Terremotos de Venezuela** (M7.2 + M7.5, 24 jun 2026, Caracas/La Guaira) | Deformación cosísmica (InSAR) | NASA Earth Observatory, 10 jul 2026 — hasta ~60 cm de desplazamiento hacia el oeste junto al aeropuerto. Crédito: NASA Earth Observatory/Lauren Dauphin; datos Eric Fielding, NISAR science team (JPL) | GUNW cosísmico en 3 pares y 2 geometrías: T162 A (13→25 jun), T061 A (18→30 jun), T126 D (22 jun→4 jul) | **Procesar nosotros** con `08_insar.py` y validar contra el mapa de JPL |
| 2 | **Subsidencia de Ciudad de México** | Subsidencia (InSAR) | JPL PIA26709, 28 abr 2026 — >2 cm/mes (25 oct 2025 → 17 ene 2026). Crédito: NASA/JPL-Caltech/David Bekaert | 66 GUNW + 75 GCOV (oct 2025 → oct 2026) | Ficha con imagen oficial; opcional: procesar (es el mismo tipo de caso que Lorca, pero ~10× más rápido) |
| 3 | **Volcán Krasheninnikov** (Kamchatka, primera erupción en ~500 años, tras el M8.8 del 30 jul 2025) | Coladas de lava (retrodispersión) | JPL, 24 sep 2026 — timelapse con 17 imágenes (25 dic 2025 → ago 2026). Crédito: NASA Scientific Visualization Studio | 38 GUNW + 56 GCOV | Ficha con el vídeo oficial |
| 4 | **Inundaciones de Mozambique** (cuencas del Limpopo e Incomati; >600 000 desplazados) | Inundación (GCOV, HH/HV) | NASA SVS 5661, 6 ago 2026 — antes y después: 5 y 17 ene 2026. Crédito: Z. Armstrong (Navteca), A. Christensen y B. Chapman (JPL), A. Wang (JPL) | GCOV T114 A, frame 165: 24 dic, 5 ene y 17 ene | Ficha con la imagen oficial; opcional: procesar con nuestro flujo de la DANA |

Cada caso cubre un tipo de riesgo distinto (terremoto, subsidencia, volcán e inundación), y los cuatro tienen equivalente en los casos españoles (Granada, Lorca, La Palma y DANA).

## Descartados
- Terremoto de Myanmar (mar 2025): anterior al lanzamiento.
- Terremoto de Kamchatka M8.8 (30 jul 2025): sin imagen previa (NISAR se lanzó ese mismo día).
- Inundaciones de Assam (jul 2026): el único mapa NISAR es de un informe universitario, no de NASA.
- Primeras imágenes de prueba (Maine, Dakota del Norte, Misisipi, Mount St. Helens/Rainier, Antártida): muy bonitas, pero no son eventos.

## Fuentes
- https://science.nasa.gov/earth/earth-observatory/where-venezuelas-earthquakes-shifted-the-ground/
- https://www.jpl.nasa.gov/images/pia26709-us-indian-spacecraft-captures-mexico-city-subsidence/
- https://www.jpl.nasa.gov/news/us-india-satellite-captures-time-lapse-video-of-volcanic-eruption/
- https://svs.gsfc.nasa.gov/5661
