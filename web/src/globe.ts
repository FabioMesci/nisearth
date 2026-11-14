import Globe, { type GlobeInstance } from 'globe.gl'
import { KIND_META, CONTENT } from './content'
import type { CaseIndexItem, WatchFire } from './types'

const HOME = { lat: 34, lng: -4, altitude: 1.55 }

export class GlobeView {
  private globe: GlobeInstance
  private el: HTMLElement
  private pts: object[] = []

  constructor(el: HTMLElement, cases: CaseIndexItem[], onSelect: (id: string) => void) {
    this.el = el
    const pts = cases.map((c) => ({ ...c, lat: c.center[1], lng: c.center[0] }))
    this.pts = pts

    this.globe = new Globe(el, { animateIn: false })
      .globeImageUrl('/earth-blue-marble.jpg')
      .bumpImageUrl('/earth-topology.png')
      .backgroundImageUrl('/night-sky.png')
      .atmosphereColor('#4cc9f0')
      .atmosphereAltitude(0.18)
      // anillos pulsantes
      .ringsData(pts)
      .ringLat('lat')
      .ringLng('lng')
      .ringColor((d: object) => {
        const c = KIND_META[(d as CaseIndexItem).kind].color
        return (t: number) => hexA(c, 1 - t)
      })
      .ringMaxRadius(4)
      .ringPropagationSpeed(2.5)
      .ringRepeatPeriod(1100)
      // marcadores HTML (icono + etiqueta)
      .htmlElementsData(pts)
      .htmlLat('lat')
      .htmlLng('lng')
      .htmlAltitude(0.01)
      .htmlElement((d: object) => {
        const c = d as CaseIndexItem
        const meta = KIND_META[c.kind]
        // el contenedor exterior lo posiciona globe.gl; el interior lleva nuestro estilo
        const wrap = document.createElement('div')
        const m = document.createElement('button')
        m.className = `marker ${c.center[0] < -3 ? 'left' : ''}`
        m.style.setProperty('--c', meta.color)
        m.innerHTML = `<span class="dot">${meta.icon}</span><span class="tag"><b>${CONTENT[c.id]?.place ?? c.title}</b><i>${meta.label} · ${CONTENT[c.id]?.dateLabel ?? ''}</i></span>`
        m.onclick = (e) => {
          e.stopPropagation()
          onSelect(c.id)
        }
        wrap.appendChild(m)
        return wrap
      })

    const ctrl = this.globe.controls()
    ctrl.autoRotate = true
    ctrl.autoRotateSpeed = 0.18
    ctrl.enableDamping = true
    this.globe.pointOfView(HOME, 0)
    this.globe.onGlobeReady(() => this.globe.pointOfView(HOME, 0))

    const resize = () => this.globe.width(el.clientWidth).height(el.clientHeight)
    window.addEventListener('resize', resize)
    resize()
  }

  /** Vigilancia España: un punto por incendio activo; la huella de la próxima pasada NISAR del seleccionado */
  setWatch(fires: WatchFire[], swath: object[] = []) {
    this.globe
      .pointsData(fires)
      .pointLat('lat')
      .pointLng('lng')
      .pointAltitude((f: object) => 0.01 + Math.log10(1 + (f as WatchFire).frp) * 0.02)
      .pointRadius(0.22)
      .pointColor(() => '#f97316')
      .pointsMerge(false)
      .polygonsData(swath)
      .polygonCapColor(() => 'rgba(76,201,240,0.16)')
      .polygonSideColor(() => 'rgba(76,201,240,0.05)')
      .polygonStrokeColor(() => 'rgba(76,201,240,0.9)')
      .polygonAltitude(0.004)
  }

  /** Vista cercana de un punto sin entrar en el mapa de detalle */
  lookAt(lng: number, lat: number, altitude = 0.35) {
    this.globe.controls().autoRotate = false
    this.globe.pointOfView({ lat, lng, altitude }, 1400)
  }

  /** Acerca la cámara al caso; resuelve cuando termina la animación. */
  flyTo(lng: number, lat: number): Promise<void> {
    this.globe.controls().autoRotate = false
    this.globe.pointOfView({ lat, lng, altitude: 0.25 }, 1600)
    return new Promise((r) => setTimeout(r, 1500))
  }

  /** Regenera los marcadores (cambio de idioma) */
  refresh() {
    this.globe.htmlElementsData(this.pts.map((p) => ({ ...p })))
  }

  home() {
    this.globe.pointOfView(HOME, 1400)
    setTimeout(() => (this.globe.controls().autoRotate = true), 1400)
  }

  show(visible: boolean) {
    this.el.classList.toggle('hidden', !visible)
    if (visible) this.globe.resumeAnimation()
    else setTimeout(() => this.globe.pauseAnimation(), 700)
  }
}

function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, a).toFixed(2)})`
}
