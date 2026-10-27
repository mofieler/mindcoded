// @ts-check
/**
 * mindcoded.studio — gemeinsamer Zustand und Hilfen für alle Bausteine (app.js lädt sie).
 *
 * - data: Seitendaten aus <script id="mc-data"> (vom Build erzeugt: Texte, Breakpoints, Formular-Regeln)
 * - media: Breakpoints aus den CSS-Einstellungen (tokens.js)
 * - motion: globaler Pause-Zustand (Schalter »Animationen anhalten«, »Bewegung reduzieren«)
 * - fields/state: alle Punktwolken und die Hero-Animation – für Farbwechsel und Pause
 */

import { DotField } from './dotfield.js';
import { createMedia, dotPalette } from './tokens.js';

export const root = document.documentElement;
/** @type {(sel: string, ctx?: ParentNode) => HTMLElement | null} */
export const $ = (sel, ctx = document) => ctx.querySelector(sel);
/** @type {(sel: string, ctx?: ParentNode) => HTMLElement[]} */
export const $$ = (sel, ctx = document) => /** @type {HTMLElement[]} */ ([...ctx.querySelectorAll(sel)]);

/** Element, das es geben muss – fehlt es, bricht nur der aufrufende Baustein ab (app.js › boot). */
/** @type {(sel: string, ctx?: ParentNode) => HTMLElement} */
export const must = (sel, ctx = document) => {
  const el = $(sel, ctx);
  if (!el) throw new Error(`Element fehlt: ${sel}`);
  return el;
};

/** Nächstes passendes Element vom Ereignisziel aufwärts (null, wenn das Ziel kein Element ist). */
/** @type {(e: Event, sel: string) => HTMLElement | null} */
export const closest = (e, sel) => (e.target instanceof Element ? e.target.closest(sel) : null);

/** @type {Record<string, any>} */
export const data = (() => {
  try {
    return JSON.parse($('#mc-data')?.textContent || '{}');
  } catch (e) {
    return {};
  }
})();

export const media = createMedia(data.media);
export const isDesktop = () => media('desktop').matches;
export const reduceQuery = media('motion-reduced');

/** Laufende Animationen: Hero (höchstens eine) und alle Punktwolken. */
/** @type {{ hero: any }} */
export const state = { hero: null };
/** @type {Set<any>} */
export const fields = new Set();

export const motion = {
  paused: reduceQuery.matches,
  listeners: new Set(),
  set(paused) {
    this.paused = paused;
    root.classList.toggle('motion-paused', paused);
    $$('[data-motion-toggle]').forEach(btn => btn.setAttribute('aria-pressed', String(paused)));
    this.listeners.forEach(fn => fn(paused));
  },
  on(fn) {
    this.listeners.add(fn);
  },
};

/** Neue Punktwolke mit Farben aus den Tokens; folgt Farbschema und Pause automatisch. */
export function createField(canvas, options, onNavy = false) {
  const field = new DotField(canvas, { colors: dotPalette(onNavy), paused: motion.paused, ...options });
  /** @type {any} */ (field).onNavy = onNavy;
  fields.add(field);
  return field;
}
