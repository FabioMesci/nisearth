import './style.css'
import { GlobeView } from './globe'
import { DetailView } from './detail'
import { Panel } from './panel'
import { CONTENT, KIND_META, getStory } from './content'
import { lang, setLang, onLang, t, locale } from './i18n'
import { ICON } from './icons'
import { getHazards } from './hazards'
import { Sheet } from './sheet'
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
  const panel = new Panel($('panel-body'), detail)

  // móvil: panel del caso y lista de incidentes como paneles inferiores deslizables
  const vh = () => window.innerHeight
  const panelSheet = new Sheet($('panel'), $('panel').querySelector<HTMLElement>('.sheet-grip')!, () => [104, Math.round(vh() * 0.52), Math.round(vh() * 0.88)])
  panelSheet.onChange = (h, settled) => {
    // los controles del mapa y la tarjeta de la historia siguen al borde del panel
    document.body.style.setProperty('--sheet-h', `${Math.round(h)}px`)
    detail.setBottomInset(h, settled)
  }
  panelSheet.reset()
  new Sheet($('cases'), $('cases').querySelector<HTMLElement>('.sheet-grip')!, () => [100, Math.round(vh() * 0.46), Math.round(vh() * 0.82)])
  let current: string | null = null
  // cada navegación (abrir caso / volver) incrementa nav; una apertura que ve otro valor tras un await se abandona
  let nav = 0

  const openCase = async (id: string) => {
    if (current === id) return
    const token = ++nav
    panel.stop()
    const m = await getManifest(id)
    if (token !== nav) return
    current = id
    document.body.classList.add('in-detail')
    markActive()
    panelSheet.reset() // cada caso empieza con el panel a media altura
    await globe.flyTo(m.center[0], m.center[1])
    if (token !== nav) return
    detail.show(true)
    await detail.open(m)
    if (token !== nav) return
    globe.show(false)
    panel.render(m)
    $('panel').classList.remove('hidden')
    $('panel').scrollTop = 0 // después de mostrarlo: con display:none no tiene efecto
    $('back-btn').classList.remove('hidden')
  }

  const goHome = () => {
    nav++ // cancela cualquier apertura en curso
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
    // dos grupos: cambios de la superficie (antes/después) y movimiento del terreno (interferometría)
    const surface = (c: CaseIndexItem) => c.kind === 'fire' || c.kind === 'flood' || c.id === 'rasuwa'
    const row = (c: CaseIndexItem) => {
      const meta = KIND_META[c.kind]
      const ct = CONTENT[c.id]
      return `<li><button data-id="${c.id}" style="--c:${meta.color}" title="${ct?.place ?? c.title}"><span class="ic">${meta.icon}</span><span class="txt"><b>${ct?.short ?? c.title}<span class="rg">${ct?.region ?? ''}</span></b><i>${ct?.kindLabel ?? meta.label} · ${ct?.dateLabel ?? ''}</i></span></button></li>`
    }
    const es = cases.filter((c) => c.region !== 'world')
    const groups = [
      { label: t('groupSurface'), items: es.filter((c) => surface(c)) },
      { label: t('groupGround'), items: es.filter((c) => !surface(c)) },
      { label: t('groupWorld'), items: cases.filter((c) => c.region === 'world') },
    ].filter((g) => g.items.length)
    list.innerHTML = groups.map((g) => `<li class="grp">${g.label}</li>${g.items.map(row).join('')}`).join('')
    markActive()
  }
  // pasar por una fila resalta su marcador en el globo
  list.addEventListener('pointerover', (e) => globe.highlight((e.target as HTMLElement).closest<HTMLButtonElement>('button[data-id]')?.dataset.id ?? null))
  list.addEventListener('pointerleave', () => globe.highlight(null))
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
    document.title = lang === 'en' ? 'NISEarth · what the radar saw' : 'NISEarth · lo que vio el radar'
    $('slider-handle').setAttribute('aria-label', t('sliderAria'))
    document.querySelectorAll('.sheet-grip').forEach((g) => g.setAttribute('aria-label', t('sheetGrip')))
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
        <h3>${s.title}</h3>
        <p>${s.text}</p>
        <div class="story-nav">
          <button class="btn ghost icon" id="st-close" aria-label="${t('close')}" title="${t('close')}">${ICON.close}</button>
          <span class="steps" aria-label="${step + 1} / ${STORY.length}">${STORY.map((_, i) => `<i class="${i === step ? 'on' : i < step ? 'done' : ''}"></i>`).join('')}</span>
          ${step > 0 ? `<button class="btn ghost icon" id="st-prev" aria-label="${t('prev')}" title="${t('prev')}">${ICON.prev}</button>` : ''}
          <button class="btn primary" id="st-next">${step < STORY.length - 1 ? t('next') : t('explore')}${ICON.next}</button>
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

  // ---------- hazard guide ----------
  const hz = $('hazards')
  const renderHazards = () => {
    hz.innerHTML = `
      <div class="hz-card card">
        <div class="hz-head">
          <div><div class="kicker">${t('hazardsBtn')}</div><h2>${t('hazards')}</h2></div>
          <button class="btn ghost icon" id="hz-close" aria-label="${t('close')}" title="${t('close')}">${ICON.close}</button>
        </div>
        <p class="hz-intro">${t('hazardsIntro')}</p>
        <div class="hz-grid">
          ${getHazards().map(
            (h) => `<article class="hz" style="--c:${h.color}">
              <header><span class="ic">${h.icon}</span><b>${h.name}</b><em class="${h.status}">${h.status === 'live' ? t('hazLive') : t('hazPlanned')}</em></header>
              <p class="tag">${h.tagline}</p>
              <dl>
                <dt>${t('hazSignature')}</dt><dd>${h.signature}</dd>
                <dt>${t('hazTechnique')}</dt><dd>${h.technique}</dd>
                <dt>${t('hazProducts')}</dt><dd>${h.products}</dd>
                <dt>${t('hazWho')}</dt><dd>${h.who}</dd>
              </dl>
              ${h.caseId && cases.some((c) => c.id === h.caseId) ? `<button class="btn ghost hz-open" data-case="${h.caseId}">${t('hazOpen')(CONTENT[h.caseId]?.place ?? '')}</button>` : ''}
            </article>`,
          ).join('')}
        </div>
      </div>`
    $('hz-close').onclick = closeHazards
    hz.querySelectorAll<HTMLButtonElement>('.hz-open').forEach((b) => (b.onclick = () => (closeHazards(), openCase(b.dataset.case!))))
  }
  const closeHazards = () => hz.classList.add('hidden')
  $('hazards-btn').onclick = () => (renderHazards(), hz.classList.remove('hidden'))
  hz.onclick = (e) => e.target === hz && closeHazards()
  window.addEventListener('keydown', (e) => e.key === 'Escape' && closeHazards())
  onLang(() => !hz.classList.contains('hidden') && renderHazards())
}

main()
