import './style.css'
import { GlobeView } from './globe'
import { DetailView } from './detail'
import { Panel } from './panel'
import { CONTENT, KIND_META, getStory } from './content'
import { lang, setLang, onLang, t, locale } from './i18n'
import type { CaseIndexItem, Manifest, Watch, WatchFire } from './types'

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T

const manifests = new Map<string, Manifest>()
const getManifest = async (id: string) => {
  if (!manifests.has(id)) manifests.set(id, await (await fetch(`/data/${id}/manifest.json`)).json())
  return manifests.get(id)!
}

async function main() {
  const cases: CaseIndexItem[] = (await (await fetch('/data/index.json')).json()).sort(
    (a: CaseIndexItem, b: CaseIndexItem) => (CONTENT[a.id]?.order ?? 9) - (CONTENT[b.id]?.order ?? 9),
  )

  const detail = new DetailView($('map'))
  const panel = new Panel($('panel'), detail)
  let current: string | null = null

  const openCase = async (id: string) => {
    if (current === id) return
    const m = await getManifest(id)
    current = id
    document.body.classList.add('in-detail')
    await globe.flyTo(m.center[0], m.center[1])
    detail.show(true)
    await detail.open(m)
    globe.show(false)
    panel.render(m)
    $('panel').classList.remove('hidden')
    $('back-btn').classList.remove('hidden')
    markActive()
  }

  const goHome = () => {
    if (!current) return
    current = null
    sel = -1
    panel.stop()
    document.body.classList.remove('in-detail')
    globe.show(true)
    detail.show(false)
    globe.home()
    $('panel').classList.add('hidden')
    $('back-btn').classList.add('hidden')
    markActive()
  }

  const globe = new GlobeView($('globe'), cases, openCase)

  // ---------- Vigilancia España: incendios activos + próxima pasada NISAR (pipeline/05_external.py watch) ----------
  let watch: Watch | null = null
  let sel = -1
  const fmtPass = (iso: string) => {
    const d = new Date(iso)
    const days = Math.round((new Date(d.toDateString()).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000)
    const hour = d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' })
    if (days < 0) return t('passDone')
    return days === 0 ? `${t('today')} ${hour}` : days === 1 ? `${t('tomorrow')} ${hour}` : t('inDays')(days, d.toLocaleDateString(locale(), { day: 'numeric', month: 'short' }))
  }
  const swathOf = (f: WatchFire) => {
    const p = f.passes[0]
    const tr = p && watch?.tracks.find((x) => x.track === p.track && x.dir === p.dir)
    if (!tr) return []
    return tr.geom.type === 'Polygon' ? [{ geometry: tr.geom }] : tr.geom.coordinates.map((c: number[][][]) => ({ geometry: { type: 'Polygon', coordinates: c } }))
  }
  const renderWatch = () => {
    const box = $('watch')
    if (!watch) return box.classList.add('hidden')
    box.classList.remove('hidden')
    const fires = watch.fires.slice(0, 5)
    box.innerHTML = `
      <div class="label">${t('watch')}</div>
      <p class="watch-sub">${t('watchSub')(watch.hotspots, watch.industrial)}</p>
      ${fires.length ? `<ul>${fires.map((f, i) => {
        const p = f.passes[0]
        return `<li><button data-i="${i}" class="${i === sel ? 'on' : ''}"><span class="dot"></span><span>
          <b>${f.town || '—'}</b> ${f.region && f.region !== f.town ? `<em>${f.region}</em>` : ''}
          <i>${f.n} ${t('hotspots')} · ${p ? `${t('nisarNext')} ${fmtPass(p.next)} · ${t('track')} ${p.track} ${p.dir === 'asc' ? '↑' : '↓'}` : t('noPass')}</i></span></button></li>`
      }).join('')}</ul>` : `<p class="watch-sub">${t('noFires')}</p>`}
      <p class="watch-ex">${t('watchExample')}</p>
      <p class="watch-src">NASA FIRMS VIIRS · ASF NISAR · ${new Date(watch.generated).toLocaleString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>`
  }
  $('watch').onclick = (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-i]')
    if (!b || !watch) return
    sel = +b.dataset.i!
    const f = watch.fires[sel]
    globe.setWatch(watch.fires, swathOf(f))
    globe.lookAt(f.lng, f.lat, 0.3)
    renderWatch()
  }
  fetch('/data/live/watch.json')
    .then((r) => (r.ok ? r.json() : null))
    .then((j: Watch | null) => {
      watch = j
      if (watch) globe.setWatch(watch.fires)
      renderWatch()
    })
    .catch(() => {})

  // lista lateral de incidentes
  const list = $('case-list')
  const renderList = () => {
    list.innerHTML = cases
      .map((c) => {
        const meta = KIND_META[c.kind]
        return `<li><button data-id="${c.id}" style="--c:${meta.color}"><span class="ic">${meta.icon}</span><span><b>${CONTENT[c.id]?.place ?? c.title}</b><i>${meta.label} · ${CONTENT[c.id]?.dateLabel ?? ''}</i></span></button></li>`
      })
      .join('')
    markActive()
  }
  list.onclick = (e) => {
    const b = (e.target as HTMLElement).closest('button')
    if (b?.dataset.id) openCase(b.dataset.id)
  }
  const markActive = () => list.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.id === current))

  // ---------- idioma ----------
  const applyStatic = () => {
    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
      el.innerHTML = t(el.dataset.i18n as Parameters<typeof t>[0]) as string
    })
    document.querySelectorAll<HTMLButtonElement>('#lang button').forEach((b) => b.classList.toggle('on', b.dataset.lang === lang))
  }
  $('lang').onclick = (e) => {
    const b = (e.target as HTMLElement).closest('button')
    if (b?.dataset.lang && b.dataset.lang !== lang) setLang(b.dataset.lang as 'es' | 'en')
  }
  onLang(() => {
    applyStatic()
    renderList()
    renderWatch()
    globe.refresh()
    panel.rerender()
    detail.render()
    if (step >= 0) renderStep()
  })
  document.documentElement.lang = lang
  applyStatic()
  renderList()

  $('back-btn').onclick = goHome
  window.addEventListener('keydown', (e) => e.key === 'Escape' && goHome())

  // ---------- modo historia ----------
  let step = -1
  const story = $('story')
  const renderStep = async () => {
    const STORY = getStory()
    const s = STORY[step]
    story.innerHTML = `
      <div class="card story-card">
        <div class="kicker">${step + 1} / ${STORY.length}</div>
        <h3>${s.title}</h3>
        <p>${s.text}</p>
        <div class="story-nav">
          <button class="btn ghost" id="st-close">${t('close')}</button>
          <span></span>
          ${step > 0 ? '<button class="btn ghost" id="st-prev">←</button>' : ''}
          <button class="btn" id="st-next">${step < STORY.length - 1 ? t('next') : t('explore')}</button>
        </div>
      </div>`
    story.classList.remove('hidden')
    $('st-close').onclick = endStory
    $('st-next').onclick = () => (step < getStory().length - 1 ? (step++, renderStep()) : endStory())
    if (step > 0) $('st-prev').onclick = () => (step--, renderStep())
    if (s.target) await openCase(s.target)
    else goHome()
  }
  const endStory = () => {
    story.classList.add('hidden')
    step = -1
  }
  $('story-btn').onclick = () => ((step = 0), renderStep())
}

main()
