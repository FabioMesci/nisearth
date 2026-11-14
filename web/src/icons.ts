// Iconos SVG (trazo 1.75, currentColor). Sustituyen a emoji y glifos unicode.
const svg = (d: string, extra = '') =>
  `<svg class="i" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${d}</svg>`

export const ICON = {
  fire: svg('<path d="M12 3c.5 3.2 2.4 4.9 3.9 6.6A6.5 6.5 0 0 1 12 21a6.5 6.5 0 0 1-4.6-11.1c.3 1.6 1.2 2.6 2.3 3.1C9.4 9.6 10.4 6 12 3Z"/>'),
  flood: svg('<path d="M12 3.5s-5.5 6-5.5 10a5.5 5.5 0 0 0 11 0c0-4-5.5-10-5.5-10Z"/><path d="M9.2 14.2a2.8 2.8 0 0 0 2.8 2.8"/>'),
  earthquake: svg('<path d="M2 12h4l2.5-6 3.5 12 3-9 1.5 3H22"/>'),
  landslide: svg('<path d="M3 6l18 12H3V6Z"/><circle cx="11" cy="12" r="1.2"/><circle cx="15" cy="15" r="1"/>'),
  volcano: svg('<path d="M3 20l6-11h6l6 11H3Z"/><path d="M12 6V3M9 7L8 4M15 7l1-3"/>'),
  subsidence: svg('<path d="M3 7h18"/><path d="M12 10v8M8.5 14.5 12 18l3.5-3.5"/><path d="M3 21h18"/>'),
  play: svg('<path d="M8 5.5v13l10.5-6.5L8 5.5Z" fill="currentColor"/>'),
  pause: svg('<rect x="7" y="5.5" width="3.5" height="13" rx="1" fill="currentColor" stroke="none"/><rect x="13.5" y="5.5" width="3.5" height="13" rx="1" fill="currentColor" stroke="none"/>'),
  back: svg('<path d="M15 6l-6 6 6 6"/>'),
  prev: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  next: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  story: svg('<circle cx="12" cy="12" r="8.5"/><path d="M10.5 9v6l4.5-3-4.5-3Z" fill="currentColor"/>'),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  drag: svg('<path d="M9 7l-5 5 5 5M15 7l5 5-5 5"/>'),
}
