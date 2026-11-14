// Panel inferior deslizable (solo móvil): se arrastra desde la barra superior entre tres alturas
// (recogido · medio · extendido). Un toque en la barra pasa a la siguiente altura.
const MOBILE = matchMedia('(max-width: 900px)')

export class Sheet {
  private el: HTMLElement
  private snaps: () => number[]
  private initial: number
  private idx: number
  private justDragged = false
  /** Altura visible del panel; `settled` = ha terminado de moverse (no en cada fotograma del arrastre) */
  onChange?: (h: number, settled: boolean) => void

  constructor(el: HTMLElement, grip: HTMLElement, snaps: () => number[], initial = 1) {
    this.el = el
    this.snaps = snaps
    this.initial = this.idx = initial
    MOBILE.addEventListener('change', () => this.apply())
    window.addEventListener('resize', () => this.apply())
    this.initDrag(grip)
    grip.addEventListener('click', () => {
      if (this.justDragged) return void (this.justDragged = false)
      const n = this.snaps().length
      this.snapTo(this.idx === n - 1 ? n - 2 : this.idx + 1)
    })
    this.apply()
  }

  get active() {
    return MOBILE.matches
  }

  /** Vuelve a la altura inicial (p. ej. al abrir otro caso) */
  reset() {
    this.idx = this.initial
    this.apply()
  }

  snapTo(i: number) {
    const s = this.snaps()
    this.idx = Math.max(0, Math.min(s.length - 1, i))
    this.setH(s[this.idx], true)
  }

  private apply() {
    if (!this.active) {
      this.el.style.height = ''
      this.onChange?.(0, true)
      return
    }
    this.setH(this.snaps()[this.idx], false)
  }

  private setH(h: number, animate: boolean) {
    this.el.classList.toggle('dragging', !animate)
    this.el.style.height = `${Math.round(h)}px`
    this.onChange?.(h, true)
  }

  private initDrag(grip: HTMLElement) {
    let startY = 0, startH = 0, moved = false, dragging = false
    let samples: { y: number; t: number }[] = []
    grip.addEventListener('pointerdown', (e) => {
      if (!this.active) return
      dragging = true
      moved = false
      startY = e.clientY
      startH = this.el.getBoundingClientRect().height
      samples = [{ y: e.clientY, t: e.timeStamp }]
      grip.setPointerCapture(e.pointerId)
      this.el.classList.add('dragging')
    })
    grip.addEventListener('pointermove', (e) => {
      if (!dragging) return
      if (Math.abs(e.clientY - startY) > 6) moved = true
      if (!moved) return
      const s = this.snaps()
      // un poco de resistencia más allá de los extremos
      let h = startH + (startY - e.clientY)
      if (h < s[0]) h = s[0] - (s[0] - h) * 0.3
      if (h > s[s.length - 1]) h = s[s.length - 1] + (h - s[s.length - 1]) * 0.3
      this.el.style.height = `${Math.round(h)}px`
      this.onChange?.(h, false)
      samples.push({ y: e.clientY, t: e.timeStamp })
      if (samples.length > 5) samples.shift()
    })
    const end = () => {
      if (!dragging) return
      dragging = false
      if (!moved) {
        this.el.classList.remove('dragging')
        return // es un toque: lo gestiona el evento click
      }
      this.justDragged = true
      setTimeout(() => (this.justDragged = false), 0)
      // proyectar la posición con la velocidad del gesto (un movimiento rápido salta de altura)
      const a = samples[0], b = samples[samples.length - 1]
      const v = b.t > a.t ? (a.y - b.y) / (b.t - a.t) : 0 // px/ms, positivo hacia arriba
      const target = this.el.getBoundingClientRect().height + v * 180
      const s = this.snaps()
      let best = 0
      s.forEach((x, i) => Math.abs(x - target) < Math.abs(s[best] - target) && (best = i))
      this.snapTo(best)
    }
    grip.addEventListener('pointerup', end)
    grip.addEventListener('pointercancel', end)
  }
}
