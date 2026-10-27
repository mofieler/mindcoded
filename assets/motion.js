// @ts-check
/**
 * mindcoded.studio — Animationen anhalten (WCAG 2.2.2): Schalter im Footer und Systemeinstellung
 * »Bewegung reduzieren«. Hält Punktwolken, Hero, Schreibeffekt und Story-Ablauf gemeinsam an.
 */

import { $$, fields, motion, reduceQuery, state } from './context.js';

export function initMotion() {
  motion.on(paused => {
    fields.forEach(f => f.setPaused(paused));
    if (state.hero) state.hero.setPaused(paused);
  });
  $$('[data-motion-toggle]').forEach(btn => btn.addEventListener('click', () => motion.set(!motion.paused)));
  reduceQuery.addEventListener('change', e => { if (e.matches) motion.set(true); });
  motion.set(motion.paused);
}
