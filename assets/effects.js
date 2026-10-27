// @ts-check
/**
 * mindcoded.studio — kleine Effekte: magnetische Buttons (nur Maus) und Einblenden beim
 * Hineinscrollen (ohne JavaScript oder bei »Bewegung reduzieren« ist alles sofort sichtbar).
 */

import { $$, closest, media, motion, reduceQuery } from './context.js';

export function initMagnets() {
  /** @type {HTMLElement | null} */
  let current = null;
  const reset = el => {
    if (!el) return;
    el.style.transition = 'transform 600ms cubic-bezier(.2,.7,.2,1)';
    el.style.transform = '';
    const arrow = /** @type {HTMLElement | null} */ (el.querySelector('[data-arrow] > span'));
    if (arrow) arrow.style.transform = '';
    current = null;
  };
  document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || motion.paused || !media('fine').matches) return;
    const el = closest(e, '[data-mag]');
    if (current && current !== el) reset(current);
    if (!el) return;
    current = el;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    el.style.transition = 'transform 250ms cubic-bezier(.2,.7,.2,1)';
    el.style.transform = `translate(${(dx * 0.18).toFixed(1)}px, ${(dy * 0.3).toFixed(1)}px)`;
    const arrow = /** @type {HTMLElement | null} */ (el.querySelector('[data-arrow] > span'));
    if (arrow) arrow.style.transform = 'translateX(3px) rotate(-45deg)';
  }, { passive: true });
  motion.on(paused => { if (paused) reset(current); });
}

export function initReveal() {
  const targets = $$('[data-rv]');
  if (!('IntersectionObserver' in window) || reduceQuery.matches) {
    targets.forEach(el => el.classList.add('is-revealed'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  targets.forEach(el => io.observe(el));
  // Sprung per Anker oder Tastatur: Ziel sofort zeigen statt auf das Reveal zu warten
  document.addEventListener('focusin', e => {
    const el = closest(e, '[data-rv]');
    if (el) el.classList.add('is-revealed');
  });
}
