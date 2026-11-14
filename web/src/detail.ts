import * as maplibregl from 'maplibre-gl'
import type { GeoJSONSourceSpecification, ImageSource, Map as MLMap } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'

// Vite reempaqueta MapLibre: le indicamos dónde está su worker
maplibregl.setWorkerUrl(workerUrl)
import type { Manifest, Frame, Sensor } from './types'
import { t, fmtDay } from './i18n'

export type Pol = 'hh' | 'hv' | 'rgb'
export type ViewMode = 'compare' | 'timeline' | 'change'

/** Risk classes, very low to very high */
export const RISK_COLORS = ['#5b6b86', '#f2d96b', '#f5a03b', '#e4572e', '#a3123b']

const ESRI_IMAGERY = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const ESRI_LABELS =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'

const loadImg = (url: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image()
    i.crossOrigin = 'anonymous'
    i.onload = () => res(i)
    i.onerror = rej
    i.src = url
  })

export class DetailView {
  map: MLMap
  private el: HTMLElement
  private m?: Manifest
  private base = ''
  private cache = new Map<string, HTMLImageElement>()
  private canvas = document.createElement('canvas')
  private handle = document.getElementById('slider-handle')!
  private labels = document.getElementById('slider-labels')!

  mode: ViewMode = 'compare'
  pol: Pol = 'hh'
  sensor: Sensor = 'L'
  split = 0.5
  frameIdx = 0
  showMask = false
  showRef = true
  showInfra = true
  showFirms = true
  showRisk = false
  private popup?: maplibregl.Popup
  sarOpacity = 0.9
  onFrame?: (f: Frame, i: number) => void

  constructor(el: HTMLElement) {
    this.el = el
    this.map = new maplibregl.Map({
      container: el,
      style: {
        version: 8,
        sources: {
          imagery: { type: 'raster', tiles: [ESRI_IMAGERY], tileSize: 256, maxzoom: 18, attribution: 'Imagery © Esri, Maxar, Earthstar Geographics' },
          labels: { type: 'raster', tiles: [ESRI_LABELS], tileSize: 256, maxzoom: 18 },
        },
        layers: [
          { id: 'bg', type: 'background', paint: { 'background-color': '#05070d' } },
          { id: 'imagery', type: 'raster', source: 'imagery', paint: { 'raster-saturation': -0.4, 'raster-brightness-max': 0.85 } },
        ],
      },
      center: [-3.5, 40],
      zoom: 5,
      attributionControl: { compact: true },
    })
    this.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')
    this.map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left')
    this.map.on('move', () => this.placeHandle())
    this.map.on('click', 'risk', (e) => {
      const p = e.features?.[0]?.properties
      if (!p) return
      const names = t('riskClasses')
      const bar = (label: string, v: number) => `<div class="rp-row"><span>${label}</span><i><b style="width:${Math.round(v * 100)}%"></b></i><em>${(+v).toFixed(2)}</em></div>`
      this.popup?.remove()
      this.popup = new maplibregl.Popup({ className: 'risk-popup', maxWidth: '260px' })
        .setLngLat(e.lngLat)
        .setHTML(
          `<div class="rp-head"><i style="background:${RISK_COLORS[p.cls]}"></i><b>${names[p.cls]}</b><span>${(+p.risk).toFixed(2)}</span></div>
          ${p.place ? `<div class="rp-place">${t('riskNear')(p.place)}</div>` : ''}
          ${bar(t('riskH'), p.hazard)}${bar(t('riskE'), p.exposure)}${bar(t('riskV'), p.vulnerability)}
          <dl><dt>${t('riskCellPop')}</dt><dd>${Math.round(p.population)}</dd>
          <dt>${t('riskCellRoads')}</dt><dd>${(+p.roads_km + +p.rail_km).toFixed(1)} km</dd>
          <dt>${t('riskCellHosp')}</dt><dd>${p.hospital_km} km</dd>
          <dt>${t('riskCellAge')}</dt><dd>${Math.round(p.dependent_age_pct)} %</dd>
          <dt>${t('riskCellSlope')}</dt><dd>${p.slope_deg}°</dd>
          <dt>${t('riskCellStab')}</dt><dd>${Math.round(p.stability * 100)} %</dd></dl>`,
        )
        .addTo(this.map)
    })
    this.map.on('mouseenter', 'risk', () => (this.map.getCanvas().style.cursor = 'pointer'))
    this.map.on('mouseleave', 'risk', () => (this.map.getCanvas().style.cursor = ''))
    this.initHandleDrag()
  }

  private ready() {
    return this.map.loaded() ? Promise.resolve() : new Promise<void>((r) => this.map.once('load', () => r()))
  }

  private img(name: string, base = this.base) {
    const url = `${base}/${name}`
    const hit = this.cache.get(url)
    if (hit) return Promise.resolve(hit)
    return loadImg(url).then((i) => (this.cache.set(url, i), i))
  }

  /** Contadores para descartar aperturas y repintados que otro más reciente ha dejado obsoletos */
  private openSeq = 0
  private renderSeq = 0

  async open(m: Manifest) {
    const seq = ++this.openSeq
    await this.ready()
    const base = `/data/${m.id}`
    // primero todo lo asíncrono; el mapa solo se toca si nadie ha abierto otro caso mientras tanto
    const after = m.frames.find((f) => f.date === m.pair.after) ?? m.frames[m.frames.length - 1]
    const first = await this.img(after.hh, base)
    let firms: { features: { properties: { date: string; k?: number } }[] } | null = null
    if (m.overlays.firms && m.firms) {
      // focos térmicos NASA FIRMS: k = 0 (primer día, amarillo) … 1 (último, rojo oscuro)
      const t0 = new Date(m.firms.from).getTime(), t1 = new Date(m.firms.to).getTime()
      firms = await (await fetch(`${base}/${m.overlays.firms}`)).json()
      for (const f of firms!.features) f.properties.k = (new Date(f.properties.date).getTime() - t0) / Math.max(1, t1 - t0)
    }
    if (seq !== this.openSeq) return

    // estado por defecto de cada caso (el panel lo lee después para marcar sus botones)
    this.m = m
    this.base = base
    this.mode = 'compare'
    this.pol = m.kind === 'fire' ? 'hv' : 'hh'
    this.sensor = 'L'
    this.split = 0.5
    this.showMask = false
    this.showRef = true
    this.showInfra = true
    this.showFirms = false
    this.showRisk = false
    this.frameIdx = Math.max(0, m.frames.indexOf(after))

    for (const id of ['sar', 'mask', 'labels-top', 'rail', 'rail-glow', 'roads', 'effis', 'firms', 'risk']) if (this.map.getLayer(id)) this.map.removeLayer(id)
    for (const id of ['sar', 'mask', 'rail', 'roads', 'effis', 'firms', 'risk']) if (this.map.getSource(id)) this.map.removeSource(id)

    this.canvas.width = first.naturalWidth
    this.canvas.height = first.naturalHeight

    this.map.addSource('sar', { type: 'canvas', canvas: this.canvas, coordinates: m.coordinates, animate: false })
    this.map.addLayer({ id: 'sar', type: 'raster', source: 'sar', paint: { 'raster-opacity': this.sarOpacity, 'raster-fade-duration': 0, 'raster-resampling': 'linear' } })

    if (m.layers.mask) {
      this.map.addSource('mask', { type: 'image', url: `${this.base}/${m.layers.mask}`, coordinates: m.coordinates })
      this.map.addLayer({ id: 'mask', type: 'raster', source: 'mask', layout: { visibility: this.showMask ? 'visible' : 'none' }, paint: { 'raster-opacity': 0.85 } })
    }
    this.popup?.remove()
    if (m.overlays.risk) {
      // risk index per ~500 m cell (hazard x exposure x vulnerability), coloured by class
      this.map.addSource('risk', { type: 'geojson', data: `${this.base}/${m.overlays.risk}` })
      this.map.addLayer({
        id: 'risk', type: 'fill', source: 'risk', layout: { visibility: this.showRisk ? 'visible' : 'none' },
        paint: { 'fill-color': ['match', ['get', 'cls'], 0, RISK_COLORS[0], 1, RISK_COLORS[1], 2, RISK_COLORS[2], 3, RISK_COLORS[3], RISK_COLORS[4]], 'fill-opacity': 0.62, 'fill-outline-color': 'rgba(7,9,13,0.35)' },
      })
    }
    const ref = m.overlays.effis ?? m.overlays.ems
    if (ref) {
      // referencia oficial (validación): perímetro EFFIS o inundación de Copernicus EMS, línea discontinua amarilla
      this.map.addSource('effis', { type: 'geojson', data: `${this.base}/${ref}` })
      this.map.addLayer({ id: 'effis', type: 'line', source: 'effis', layout: { visibility: this.showRef ? 'visible' : 'none' }, paint: { 'line-color': '#facc15', 'line-width': m.overlays.ems ? 1.2 : 1.6, 'line-dasharray': [3, 2] } })
    }
    if (m.overlays.roads) {
      this.map.addSource('roads', { type: 'geojson', data: `${this.base}/${m.overlays.roads}` })
      this.map.addLayer({ id: 'roads', type: 'line', source: 'roads', layout: { visibility: this.showInfra ? 'visible' : 'none' }, paint: { 'line-color': '#fbbf24', 'line-width': 2 } })
    }
    if (m.overlays.rail) {
      this.map.addSource('rail', { type: 'geojson', data: `${this.base}/${m.overlays.rail}` })
      const vis = this.showInfra ? 'visible' : 'none'
      this.map.addLayer({ id: 'rail-glow', type: 'line', source: 'rail', layout: { visibility: vis }, paint: { 'line-color': '#ff3b5c', 'line-width': 8, 'line-opacity': 0.35, 'line-blur': 4 } })
      this.map.addLayer({ id: 'rail', type: 'line', source: 'rail', layout: { visibility: vis }, paint: { 'line-color': '#ff3b5c', 'line-width': 2.5 } })
    }
    if (firms) {
      this.map.addSource('firms', { type: 'geojson', data: firms as unknown as GeoJSONSourceSpecification['data'] })
      this.map.addLayer({
        id: 'firms', type: 'circle', source: 'firms', layout: { visibility: this.showFirms ? 'visible' : 'none' },
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 1.6, 13, 5],
          'circle-color': ['interpolate', ['linear'], ['get', 'k'], 0, '#fde047', 0.5, '#f97316', 1, '#b91c1c'],
          'circle-opacity': 0.85, 'circle-stroke-width': 0.4, 'circle-stroke-color': '#1c0a00',
        },
      })
    }
    this.map.addLayer({ id: 'labels-top', type: 'raster', source: 'labels', paint: { 'raster-opacity': 0.8 } })

    const [x0, y0, x1, y1] = m.bbox
    const wide = window.innerWidth > 900
    // en móvil el panel inferior tapa la parte de abajo: encuadrar en la zona visible
    const padding = wide ? { top: 60, bottom: 60, left: 40, right: 420 } : { top: 64, bottom: Math.round(this.bottomInset) + 16, left: 16, right: 16 }
    this.settledInset = this.bottomInset
    this.map.fitBounds([[x0, y0], [x1, y1]], { padding, duration: 0 })
    await this.render()
  }

  /** Fechas y par del sensor activo (NISAR banda L o Sentinel-1 banda C) */
  get set() {
    const m = this.m!
    return this.sensor === 'C' && m.s1 ? { frames: m.s1.frames, pair: m.s1.pair, change: m.s1.change } : { frames: m.frames, pair: m.pair, change: m.layers.change }
  }

  frameFor(which: 'before' | 'after'): Frame {
    const { frames, pair } = this.set
    return frames.find((f) => f.date === pair[which]) ?? frames[which === 'before' ? 0 : frames.length - 1]
  }

  private layerOf(f: Frame) {
    return (this.pol === 'rgb' ? f.rgb : f[this.pol]) ?? f.hh
  }

  get frames() {
    return this.m ? this.set.frames : []
  }

  async render() {
    if (!this.m) return
    const seq = ++this.renderSeq
    const set = this.set
    const mode = this.mode === 'change' && !set.change ? 'compare' : this.mode
    const f = set.frames[Math.min(this.frameIdx, set.frames.length - 1)]
    // cargar antes de borrar: si mientras tanto llega otro repintado, este se descarta (sin parpadeos ni imágenes cruzadas)
    const imgs =
      mode === 'change' ? [await this.img(set.change!)]
      : mode === 'timeline' ? [await this.img(this.layerOf(f))]
      : await Promise.all([this.img(this.layerOf(this.frameFor('after'))), this.img(this.layerOf(this.frameFor('before')))])
    if (seq !== this.renderSeq) return

    const ctx = this.canvas.getContext('2d')!
    const { width: W, height: H } = this.canvas
    ctx.clearRect(0, 0, W, H)
    ctx.drawImage(imgs[0], 0, 0, W, H)
    if (mode === 'compare') {
      const b = imgs[1]
      const sx = Math.round(this.split * W)
      if (sx > 0) ctx.drawImage(b, 0, 0, sx * (b.naturalWidth / W), b.naturalHeight, 0, 0, sx, H)
    }
    if (mode === 'timeline') this.onFrame?.(f, this.frameIdx)
    const src = this.map.getSource('sar') as unknown as { play?: () => void; pause?: () => void } | undefined
    src?.play?.()
    requestAnimationFrame(() => src?.pause?.())
    this.map.triggerRepaint()
    this.placeHandle()
  }

  setMode(mode: ViewMode) {
    this.mode = mode
    this.render()
  }
  setPol(pol: Pol) {
    this.pol = pol
    this.render()
  }
  setFrame(i: number) {
    this.frameIdx = (i + this.frames.length) % this.frames.length
    this.render()
  }
  setMask(on: boolean) {
    this.showMask = on
    if (this.map.getLayer('mask')) this.map.setLayoutProperty('mask', 'visibility', on ? 'visible' : 'none')
  }
  setRef(on: boolean) {
    this.showRef = on
    if (this.map.getLayer('effis')) this.map.setLayoutProperty('effis', 'visibility', on ? 'visible' : 'none')
  }
  setInfra(on: boolean) {
    this.showInfra = on
    for (const id of ['roads', 'rail', 'rail-glow']) if (this.map.getLayer(id)) this.map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none')
  }
  setRisk(on: boolean) {
    this.showRisk = on
    if (!on) this.popup?.remove()
    if (this.map.getLayer('risk')) this.map.setLayoutProperty('risk', 'visibility', on ? 'visible' : 'none')
  }
  setFirms(on: boolean) {
    this.showFirms = on
    if (this.map.getLayer('firms')) this.map.setLayoutProperty('firms', 'visibility', on ? 'visible' : 'none')
  }
  setSensor(s: Sensor) {
    this.sensor = s
    const { frames, pair } = this.set
    this.frameIdx = Math.max(0, frames.findIndex((f) => f.date === pair.after))
    this.render()
  }
  setOpacity(v: number) {
    this.sarOpacity = v
    if (this.map.getLayer('sar')) this.map.setPaintProperty('sar', 'raster-opacity', v)
  }

  /** Altura del panel inferior (móvil). Al soltarlo, la imagen se desplaza para quedar centrada en la zona visible. */
  bottomInset = 0
  private settledInset = 0
  setBottomInset(px: number, settled: boolean) {
    this.bottomInset = px
    if (!settled) return
    const shift = (this.settledInset - px) / 2
    this.settledInset = px
    if (this.m && Math.abs(shift) > 1 && !this.el.classList.contains('hidden')) this.map.panBy([0, -shift], { duration: 400 })
  }

  show(visible: boolean) {
    this.el.classList.toggle('hidden', !visible)
    if (visible) setTimeout(() => this.map.resize(), 50)
    else this.handle.classList.add('hidden'), this.labels.classList.add('hidden')
  }

  // ---------- deslizador antes/después sobre el mapa ----------
  private placeHandle() {
    const on = !!this.m && this.mode === 'compare' && !this.el.classList.contains('hidden')
    this.handle.classList.toggle('hidden', !on)
    this.labels.classList.toggle('hidden', !on)
    if (!on || !this.m) return
    const [x0, y0, x1, y1] = this.m.bbox
    const lon = x0 + this.split * (x1 - x0)
    const top = this.map.project([lon, y1])
    const bot = this.map.project([lon, y0])
    const rect = this.el.getBoundingClientRect()
    this.handle.style.left = `${rect.left + top.x}px`
    this.handle.style.top = `${rect.top + Math.max(0, top.y)}px`
    this.handle.style.height = `${Math.max(40, Math.min(rect.height, bot.y) - Math.max(0, top.y))}px`
    const fmt = (d: string) => fmtDay(d)
    const pr = this.set.pair
    document.getElementById('lbl-before')!.textContent = `${t('before')} · ${fmt(pr.before)}`
    document.getElementById('lbl-after')!.textContent = `${t('after')} · ${fmt(pr.after)}`
    this.labels.style.left = `${rect.left + top.x}px`
    this.labels.style.top = `${rect.top + Math.max(8, top.y + 8)}px`
  }

  private initHandleDrag() {
    let dragging = false
    let raf = 0
    const move = (clientX: number) => {
      if (!this.m) return
      const rect = this.el.getBoundingClientRect()
      const ll = this.map.unproject([clientX - rect.left, rect.height / 2])
      const [x0, , x1] = this.m.bbox
      this.split = Math.min(1, Math.max(0, (ll.lng - x0) / (x1 - x0)))
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => this.render())
    }
    this.handle.addEventListener('pointerdown', (e) => {
      dragging = true
      this.handle.setPointerCapture(e.pointerId)
    })
    this.handle.addEventListener('pointermove', (e) => dragging && move(e.clientX))
    this.handle.addEventListener('pointerup', () => (dragging = false))
  }
}

export type { ImageSource }
