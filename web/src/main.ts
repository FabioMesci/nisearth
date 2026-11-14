import './style.css'
import { GlobeView } from './globe'
import { DetailView } from './detail'
import { Panel } from './panel'
import { CONTENT, KIND_META, getStory } from './content'
import { lang, setLang, onLang, t } from './i18n'
import { HAZARDS } from './hazards'
import type { CaseIndexItem, Manifest } from './types'

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

  // ---------- hazard guide ----------
  const hz = $('hazards')
  const renderHazards = () => {
    hz.innerHTML = `
      <div class="hz-card card">
        <div class="hz-head">
          <div><div class="kicker">${t('hazardsBtn')}</div><h2>${t('hazards')}</h2><p>${t('hazardsIntro')}</p></div>
          <button class="btn ghost" id="hz-close" aria-label="${t('close')}">✕</button>
        </div>
        <div class="hz-grid">
          ${HAZARDS.map(
            (h) => `<article class="hz" style="--c:${h.color}">
              <header><span class="ic">${h.icon}</span><b>${h.name}</b><em class="${h.status}">${h.status === 'live' ? t('hazLive') : t('hazPlanned')}</em></header>
              <p class="tag">${h.tagline}</p>
              <dl>
                <dt>${t('hazSignature')}</dt><dd>${h.signature}</dd>
                <dt>${t('hazTechnique')}</dt><dd>${h.technique}</dd>
                <dt>${t('hazProducts')}</dt><dd>${h.products}</dd>
                <dt>${t('hazWho')}</dt><dd>${h.who}</dd>
              </dl>
            </article>`,
          ).join('')}
        </div>
      </div>`
    $('hz-close').onclick = closeHazards
  }
  const closeHazards = () => hz.classList.add('hidden')
  $('hazards-btn').onclick = () => (renderHazards(), hz.classList.remove('hidden'))
  hz.onclick = (e) => e.target === hz && closeHazards()
  window.addEventListener('keydown', (e) => e.key === 'Escape' && closeHazards())
  onLang(() => !hz.classList.contains('hidden') && renderHazards())
}

main()
