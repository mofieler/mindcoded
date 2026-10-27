// @ts-check
/**
 * mindcoded.studio — Projekte: Akkordeon mit Vorschau-Grafiken, Illustration der Case Study,
 * Kapitelanzeige und Bildstreifen der Case Study sowie Seitenübergänge (der Projekttitel
 * »wandert« von der Liste in die Case Study).
 */

import { $, $$, createField, data, motion, must, reduceQuery } from './context.js';
import { formatCount, parseCount } from './count.js';
import { projects as projectShapes } from './shapes.js';

export function initProjects() {
  const items = $$('.project-item');
  const previews = new Map();
  let openIdx = -1;

  const toggle = index => {
    openIdx = openIdx === index ? -1 : index;
    items.forEach((item, i) => {
      const open = i === openIdx;
      item.classList.toggle('is-open', open);
      must('.project-row-btn', item).setAttribute('aria-expanded', String(open));
      const cv = $('[data-project-canvas]', item);
      if (!cv) return;
      if (open) {
        let f = previews.get(i);
        if (!f) {
          f = createField(cv, { per: 55, max: 2600, threshold: 0.2, stagger: 0.5 });
          f.setDraws(projectShapes);
          previews.set(i, f);
        }
        f.activate();
        f.show(Number(cv.dataset.projectCanvas) || 0);
      } else if (previews.get(i)) {
        previews.get(i).deactivate();
      }
    });
  };
  items.forEach((item, i) => must('.project-row-btn', item).addEventListener('click', () => toggle(i)));
}

export function initCasePage() {
  const cv = $('#case-canvas');
  if (!cv) return;
  const field = createField(cv, { per: 55, max: 2600, threshold: 0.2, stagger: 0.5 });
  field.setDraws(projectShapes);
  field.show(Number(data.shape) || 0);
}

/** Titel in Liste und Case Study tragen denselben Übergangsnamen (CSS @view-transition). */
export function initViewTransitions() {
  $$('[data-vt]').forEach(el => { el.style.viewTransitionName = el.dataset.vt || ''; });
}

/** Mitlaufende Leiste der Case Study: zeigt das Kapitel, das gerade gelesen wird. */
export function initChapters() {
  const label = $('[data-chapter-label]');
  const chapters = $$('[data-chapter]');
  if (!label || !chapters.length) return;
  const indicator = label.parentElement;
  if (!indicator) return;
  const visible = new Set();
  /** @type {string | null} */
  let current = null;
  let timer = 0;

  const set = name => {
    if (name === current) return;
    current = name;
    label.classList.add('is-changing');
    clearTimeout(timer);
    timer = setTimeout(() => {
      label.textContent = name || '';
      indicator.classList.toggle('has-chapter', Boolean(name));
      label.classList.remove('is-changing');
    }, motion.paused ? 0 : 200);
  };

  // Lesezone: schmales Band im oberen Drittel. Zwischen zwei Kapiteln bleibt das letzte stehen.
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
    const band = window.innerHeight * 0.35;
    const active = chapters.filter(c => visible.has(c)).pop();
    if (active) set(active.dataset.chapter);
    else if (chapters[0].getBoundingClientRect().top > band) set(null);
    else if (chapters[chapters.length - 1].getBoundingClientRect().bottom < band) set(null);
  }, { rootMargin: '-35% 0px -60% 0px' });
  chapters.forEach(c => io.observe(c));
}

/** Bildstreifen: Pfeile blättern um eine knappe Breite; an den Enden als nicht verfügbar markiert
 *  (aria-disabled statt disabled, damit der Tastaturfokus nicht verloren geht). */
export function initGallery() {
  const strip = $('[data-gallery]');
  const prev = $('[data-gallery-prev]');
  const next = $('[data-gallery-next]');
  if (!strip || !prev || !next) return;
  const atStart = () => strip.scrollLeft <= 2;
  const atEnd = () => strip.scrollLeft >= strip.scrollWidth - strip.clientWidth - 2;
  const update = () => {
    prev.setAttribute('aria-disabled', String(atStart()));
    next.setAttribute('aria-disabled', String(atEnd()));
  };
  const go = dir => {
    if (dir < 0 ? atStart() : atEnd()) return;
    strip.scrollBy({ left: dir * strip.clientWidth * 0.8, behavior: motion.paused ? 'auto' : 'smooth' });
  };
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  strip.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
}

/** Zahlen zählen beim Erscheinen kurz hoch (Kennzahlen, Gruppen, Anteile). Nur reine Zahlen mit
 *  optionalem »%«; Spannen wie »200–400« bleiben stehen. Screenreader lesen den Endwert aus einer
 *  versteckten Kopie (blocks.py › counted). */
export function initCountUp() {
  const els = $$('[data-count]');
  if (!els.length || !('IntersectionObserver' in window) || reduceQuery.matches) return;
  // Zielwert einmal vorab lesen – danach steht im Text zeitweise der Zwischenstand.
  /** @type {Map<HTMLElement, import('./count.js').CountTarget>} */
  const targets = new Map();
  els.forEach(el => {
    const target = parseCount(el.textContent || '');
    if (target) targets.set(el, target);
  });
  /** @param {HTMLElement} el */
  const finish = el => { const t = targets.get(el); if (t) el.textContent = t.num + t.unit; };
  /** @param {HTMLElement} el @param {number} value */
  const show = (el, value) => { const t = targets.get(el); if (t) el.textContent = formatCount(t, value); };
  const run = el => {
    const start = performance.now();
    const step = now => {
      const p = Math.min(1, (now - start) / 1100);
      if (p < 1 && !motion.paused) {
        show(el, (targets.get(el)?.value || 0) * (1 - Math.pow(1 - p, 3)));
        requestAnimationFrame(step);
      } else {
        finish(el);
      }
    };
    requestAnimationFrame(step);
  };
  // Der Bereich über dem Bildschirm zählt als »gesehen«: Wer per Anker darüber springt, sieht
  // beim Zurückscrollen den Endwert statt einer stehen gebliebenen Null.
  const io = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = /** @type {HTMLElement} */ (entry.target);
    io.unobserve(el);
    if (motion.paused || entry.boundingClientRect.bottom < 0) finish(el);
    else run(el);
  }), { threshold: 0.6, rootMargin: '100000px 0px 0px 0px' });
  targets.forEach((t, el) => {
    if (el.getBoundingClientRect().top > window.innerHeight && !motion.paused) show(el, 0);
    io.observe(el);
  });
}
