// @ts-check
/**
 * mindcoded.studio — Besucherstatistik (Umami auf eigenem Server, ohne Cookies)
 *
 * Einzige Stelle, an der Skripte Ereignisse melden. Klicks zählt Umami selbst über
 * data-umami-event (setzt der Generator); hier steht nur, was kein Klick ist.
 * Fehlt Umami (Entwicklung, Tests, »Do Not Track«, Blocker), passiert nichts.
 * Erlaubte Namen: tools/mcsite/common.py › ANALYTICS_EVENTS, Bedeutung: docs/STATISTIK.md.
 */

import { data as pageData } from './context.js';

/** So lange muss ein Abschnitt in der Bildschirmmitte stehen – Vorbeiscrollen zählt nicht */
const SECTION_DWELL_MS = 1000;
/** Obergrenze für Ereignisse, die auf das (mit »defer« geladene) Umami warten */
const QUEUE_MAX = 20;

/** @typedef {Record<string, string>} EventData */

/** @type {[string, EventData | undefined][]} */
const queue = [];

/** @returns {{ track(event: string, data?: EventData): unknown } | null} */
function tracker() {
  const umami = /** @type {any} */ (window).umami;
  return umami && typeof umami.track === 'function' ? umami : null;
}

/**
 * Meldet ein Ereignis – nur Art und feste Kennzeichen, nie Eingaben oder personenbezogene Daten.
 * @param {string} event
 * @param {EventData} [data]
 */
export function track(event, data) {
  const t = tracker();
  if (t) t.track(event, data);
  else if (queue.length < QUEUE_MAX) queue.push([event, data]);
}

/** Ereignisse, die vor Umami eintrafen, nachsenden. */
function flush() {
  const t = tracker();
  if (t) queue.splice(0).forEach(([event, data]) => t.track(event, data));
}

/**
 * Meldet nicht gefundene Seiten und zählt jeden Abschnitt mit data-track-section einmal pro Seitenaufruf,
 * sobald er eine Weile in der Bildschirmmitte steht. So zeigt die Statistik, wie weit die Startseite gelesen
 * wird; ein Sprung über das Menü, bei dem andere Abschnitte nur vorbeiziehen, zählt nur das Ziel.
 */
export function initSectionViews() {
  if (document.readyState === 'complete') flush();
  else window.addEventListener('load', flush, { once: true });

  // Kaputte Links finden: welcher Pfad ins Leere führte (nur der Pfad, ohne Parameter)
  if (pageData.page === 'notfound') track('Seite nicht gefunden', { pfad: window.location.pathname.slice(0, 200) });

  const sections = document.querySelectorAll('[data-track-section]');
  if (!sections.length || typeof IntersectionObserver === 'undefined') return;
  /** @type {Map<Element, number>} */
  const timers = new Map();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const el = entry.target;
      if (!(el instanceof HTMLElement)) continue;
      clearTimeout(timers.get(el));
      timers.delete(el);
      if (!entry.isIntersecting) continue;
      timers.set(el, window.setTimeout(() => {
        observer.unobserve(el);
        timers.delete(el);
        track('Abschnitt gesehen', { abschnitt: el.dataset.trackSection || '' });
      }, SECTION_DWELL_MS));
    }
  }, { rootMargin: '-45% 0px -45% 0px' });
  sections.forEach(el => observer.observe(el));
}
