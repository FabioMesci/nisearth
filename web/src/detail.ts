import * as maplibregl from 'maplibre-gl'
import type { ImageSource, Map as MLMap } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'

// Vite reempaqueta MapLibre: le indicamos dónde está su worker
maplibregl.setWorkerUrl(workerUrl)
import type { Manifest, Frame, Sensor } from './types'
import { t, fmtDay } from './i18n'

export type Pol = 'hh' | 'hv' | 'rgb'
export type ViewMode = 'compare' | 'timeline' | 'change'

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
    this.initHandleDrag()
  }

  private ready() {
    return this.map.loaded() ? Promise.resolve() : new Promise<void>((r) => this.map.once('load', () => r()))
  }

  private img(name: string) {
    const url = `${this.base}/${name}`
    const hit = this.cache.get(url)
    if (hit) return Promise.resolve(hit)
    return loadImg(url).then((i) => (this.cache.set(url, i), i))
  }

  async open(m: Manifest) {
    await this.ready()
    this.m = m
    this.base = `/data/${m.id}`
    this.sensor = 'L'
    this.frameIdx = Math.max(0, m.frames.findIndex((f) => f.date === m.pair.after))

    for (const id of ['sar', 'mask', 'labels-top', 'rail', 'rail-glow', 'roads', 'effis', 'firms']) if (this.map.getLayer(id)) this.map.removeLayer(id)
    for (const id of ['sar', 'mask', 'rail', 'roads', 'effis', 'firms']) if (this.map.getSource(id)) this.map.removeSource(id)

    const first = await this.img(this.layerOf(this.frameFor('after')))
    this.canvas.width = first.naturalWidth
    this.canvas.height = first.naturalHeight

    this.map.addSource('sar', { type: 'canvas', canvas: this.canvas, coordinates: m.coordinates, animate: false })
    this.map.addLayer({ id: 'sar', type: 'raster', source: 'sar', paint: { 'raster-opacity': this.sarOpacity, 'raster-fade-duration': 0, 'raster-resampling': 'linear' } })

    if (m.layers.mask) {
      this.map.addSource('mask', { type: 'image', url: `${this.base}/${m.layers.mask}`, coordinates: m.coordinates })
      this.map.addLayer({ id: 'mask', type: 'raster', source: 'mask', layout: { visibility: this.showMask ? 'visible' : 'none' }, paint: { 'raster-opacity': 0.85 } })
    }
    if (m.overlays.effis) {
      // perímetro oficial EFFIS (validación): línea discontinua amarilla
      this.map.addSource('effis', { type: 'geojson', data: `${this.base}/${m.overlays.effis}` })
      this.map.addLayer({ id: 'effis', type: 'line', source: 'effis', layout: { visibility: this.showRef ? 'visible' : 'none' }, paint: { 'line-color': '#facc15', 'line-width': 1.6, 'line-dasharray': [3, 2] } })
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
    if (m.overlays.firms && m.firms) {
      // focos térmicos NASA FIRMS (VIIRS 375 m): de amarillo (primer día) a rojo oscuro (último)
      const t0 = new Date(m.firms.from).getTime(), t1 = new Date(m.firms.to).getTime()
      const data = await (await fetch(`${this.base}/${m.overlays.firms}`)).json()
      for (const f of data.features) f.properties.k = (new Date(f.properties.date).getTime() - t0) / Math.max(1, t1 - t0)
      this.map.addSource('firms', { type: 'geojson', data })
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
    // en móvil el panel ocupa el 52 % inferior de la pantalla
    const padding = wide ? { top: 60, bottom: 60, left: 40, right: 420 } : { top: 64, bottom: Math.round(window.innerHeight * 0.52) + 16, left: 16, right: 16 }
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
    const ctx = this.canvas.getContext('2d')!
    const { width: W, height: H } = this.canvas
    ctx.clearRect(0, 0, W, H)

    const set = this.set
    if (this.mode === 'change' && set.change) {
      ctx.drawImage(await this.img(set.change), 0, 0, W, H)
    } else if (this.mode === 'timeline') {
      const f = set.frames[Math.min(this.frameIdx, set.frames.length - 1)]
      ctx.drawImage(await this.img(this.layerOf(f)), 0, 0, W, H)
      this.onFrame?.(f, this.frameIdx)
    } else {
      const [b, a] = await Promise.all([this.img(this.layerOf(this.frameFor('before'))), this.img(this.layerOf(this.frameFor('after')))])
      ctx.drawImage(a, 0, 0, W, H)
      const sx = Math.round(this.split * W)
      if (sx > 0) ctx.drawImage(b, 0, 0, sx * (b.naturalWidth / W), b.naturalHeight, 0, 0, sx, H)
    }
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
