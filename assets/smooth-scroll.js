// @ts-check
/**
 * mindcoded.studio — sanftes Scrollen nach dem Prinzip von Lenis, ohne Fremdbibliothek (ADR 0007).
 *
 * Die Seite scrollt weiter nativ: Scrollleiste, Tastatur, Touch, Suche im Text, Sticky-Elemente,
 * Scroll-Ereignisse und IntersectionObserver arbeiten unverändert. Übernommen werden nur
 *   - Mausrad- und Touchpad-Schritte: über einige Frames weich ausgeglichen (bildratenunabhängig)
 *   - Sprünge zu Abschnitten (Ankerlinks, Menü, Logo): gleiten mit fester Kurve ans Ziel
 *
 * Aus bleibt es bei reduzierter Bewegung (System oder Schalter im Footer), auf langsamen Geräten
 * (perf.js – das Scrollen liefe sonst über den ausgelasteten Hauptthread), bei Strg/⌘ + Rad (Zoom),
 * über eigenen Scrollbereichen (Textfeld, Menü; Markierung data-native-scroll) und bei offenem Menü.
 */

import { motion, root } from './context.js';
import { onQualityChange, quality } from './perf.js';

const LERP = 0.1;        // Anteil der Reststrecke je Frame bei 60 Hz – kleiner = weicher, träger
const LINE_PX = 40;      // deltaMode 1: Zeilen (Firefox unter Windows)
const SETTLE_PX = 0.5;   // darunter gilt das Ziel als erreicht
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

/** Ausklingende Kurve für Sprünge: schneller Start, sehr weiches Ankommen. */
export const easeOutExpo = t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/** Anteil der Reststrecke für einen Frame der Dauer dt (s) – gleich weich bei 60, 120 oder 144 Hz. */
export const lerpFactor = (dt, lerp = LERP) => 1 - Math.pow(1 - lerp, Math.max(0, dt) * 60);

/** Dauer eines Sprungs: kurze Wege zügig, lange Wege nicht endlos. */
export const glideDuration = distance => Math.min(1.4, 0.6 + Math.abs(distance) / 4000);

/** Raddrehung in Pixeln, unabhängig von der Einheit des Browsers. */
export function wheelDelta(e, viewport) {
  const unit = e.deltaMode === 1 ? LINE_PX : e.deltaMode === 2 ? viewport : 1;
  return e.deltaY * unit;
}

/** Element unter dem Zeiger, das selbst in diese Richtung scrollen kann – dort bleibt das Rad nativ. */
export function nestedScroller(el, dy, stop = document.body) {
  for (let node = el; node && node !== stop && node.nodeType === 1; node = node.parentElement) {
    if (node.hasAttribute('data-native-scroll')) return node;
    const oy = getComputedStyle(node).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight + 1) {
      const room = dy < 0 ? node.scrollTop > 0 : node.scrollTop + node.clientHeight < node.scrollHeight - 1;
      if (room) return node;
    }
  }
  return null;
}

/** @type {{ active: () => boolean, glideTo: (y: number) => void } | null} */
let controller = null;

/** Scrollposition, an der ein Abschnitt so steht wie beim nativen Ankersprung (scroll-padding, scroll-margin). */
function targetTop(el) {
  const pad = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  return el.getBoundingClientRect().top + window.scrollY - pad - margin;
}

/**
 * Zu einem Element oder einer Position gleiten – mit sanftem Scrollen die gleiche Kurve wie bei
 * Ankerlinks, sonst nativ (bei angehaltener Bewegung sofort).
 * @param {Element|number} target
 */
export function scrollToTarget(target) {
  const y = typeof target === 'number' ? target : targetTop(target);
  if (controller && controller.active()) controller.glideTo(y);
  else window.scrollTo({ top: y, behavior: motion.paused ? 'auto' : 'smooth' });
}

export function initSmoothScroll() {
  // Ohne Rad und feinen Zeiger (Touch) bleibt alles nativ – das Momentum dort ist besser.
  const fine = window.matchMedia('(any-hover: hover) and (any-pointer: fine)');
  let current = window.scrollY;
  let target = current;
  let raf = 0;
  let last = 0;
  /** @type {{ from: number, to: number, start: number, duration: number } | null} */
  let glide = null;
  let expected = -1;

  const max = () => Math.max(0, root.scrollHeight - window.innerHeight);
  const clamp = y => Math.max(0, Math.min(max(), y));
  const active = () => !motion.paused && quality().level === 0 && !root.classList.contains('menu-open')
    && fine.matches;

  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    glide = null;
    expected = -1;
  };

  const frame = now => {
    // Jemand anderes hat gescrollt (Scrollleiste, Tastatur, Suche im Text): sofort nachgeben.
    if (expected >= 0 && Math.abs(window.scrollY - expected) > 2) {
      stop();
      return;
    }
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    if (glide) {
      const t = Math.min(1, Math.max(0, now - glide.start) / (glide.duration * 1000));
      current = glide.from + (glide.to - glide.from) * easeOutExpo(t);
      if (t >= 1) current = target;
    } else {
      current += (target - current) * lerpFactor(dt);
      if (Math.abs(target - current) < SETTLE_PX) current = target;
    }
    window.scrollTo({ top: current, behavior: 'instant' });
    if (current === target) {
      stop();
      return;
    }
    expected = window.scrollY;
    raf = requestAnimationFrame(frame);
  };

  const run = () => {
    if (raf) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  };

  /** @param {number} y */
  const glideTo = y => {
    if (!raf) current = window.scrollY;
    target = clamp(y);
    glide = { from: current, to: target, start: performance.now(), duration: glideDuration(target - current) };
    run();
  };

  window.addEventListener('wheel', e => {
    if (e.ctrlKey || e.metaKey || e.defaultPrevented || !active()) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    const dy = wheelDelta(e, window.innerHeight);
    if (!dy || max() === 0 || nestedScroller(e.target, dy)) return;
    e.preventDefault();
    if (!raf) current = target = window.scrollY;
    if (glide) { target = current; glide = null; }
    target = clamp(target + dy);
    run();
  }, { passive: false });

  // Ankerlinks auf derselben Seite gleiten; Fokus und Adresse folgen wie beim nativen Sprung.
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !active()) return;
    const link = e.target instanceof Element ? e.target.closest('a[href*="#"]') : null;
    if (!(link instanceof HTMLAnchorElement) || link.target || link.hasAttribute('data-native-scroll') || link.classList.contains('skip-link')) return;
    const url = new URL(link.href, location.href);
    if (!url.hash || url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
    const id = decodeURIComponent(url.hash.slice(1));
    const el = id === 'top' ? null : document.getElementById(id);
    if (!el && id !== 'top') return;
    e.preventDefault();
    glideTo(el ? targetTop(el) : 0);
    if (location.hash !== url.hash) history.pushState(null, '', url.hash);
    if (el) {
      const focusTarget = /** @type {HTMLElement} */ (el.querySelector('h1, h2') || el);
      if (!focusTarget.hasAttribute('tabindex') && !focusTarget.matches('a, button, input, select, textarea')) {
        focusTarget.setAttribute('tabindex', '-1');
      }
      focusTarget.focus({ preventScroll: true });
    }
  });

  // Eingaben, die selbst scrollen, unterbrechen die Bewegung.
  window.addEventListener('pointerdown', stop, { passive: true });
  window.addEventListener('touchstart', stop, { passive: true });
  window.addEventListener('keydown', e => { if (SCROLL_KEYS.has(e.key)) stop(); }, { passive: true });
  motion.on(paused => { if (paused) stop(); });
  onQualityChange(() => { if (!active()) stop(); });

  controller = { active, glideTo };
}
