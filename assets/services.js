// @ts-check
/**
 * mindcoded.studio — Leistungen: Akkordeon und Bühne mit Story-Ablauf (Startseite) sowie die
 * Illustration auf den Leistungsseiten. Jede Leistung hat vier Szenen (shapes.js › stories).
 */

import { $, $$, createField, data, isDesktop, media, motion, must } from './context.js';
import { stories } from './shapes.js';

const SCENES = 4;
const STORY_MS = 2900;

/** Spielt die vier Szenen einer Leistung nacheinander – nur sichtbar und nicht angehalten. */
function storyLoop(element, onScene, onProgress) {
  /** @type {number | null} */
  let raf = null;
  let last = 0;
  let elapsed = 0;
  let visible = false;
  const loop = now => {
    elapsed += now - last;
    last = now;
    if (elapsed >= STORY_MS) {
      elapsed = 0;
      onScene();
    }
    if (onProgress) onProgress(Math.min(1, elapsed / STORY_MS));
    raf = requestAnimationFrame(loop);
  };
  const run = () => {
    const should = visible && !motion.paused && !document.hidden;
    if (should && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
    if (!should && raf) { cancelAnimationFrame(raf); raf = null; }
  };
  new IntersectionObserver(entries => { visible = entries.some(e => e.isIntersecting); run(); }, { threshold: 0.2 }).observe(element);
  document.addEventListener('visibilitychange', run);
  motion.on(run);
  return { reset: () => { elapsed = 0; } };
}

export function initServices() {
  const list = $('#services-accordion-list');
  if (!list) return;
  const items = $$('.service-accordion-item', list);
  const services = data.services || [];
  let active = 0;
  let scene = 0;
  /** @type {any} Punktwolke (dotfield.js, noch ohne Typprüfung) */
  let field = null;

  const cap = $('#services-card-cap');
  const idx = $('#services-card-idx');
  const title = $('#story-scene-title');
  const counter = $('#story-scene-counter');
  const bars = $$('[data-scbar]');

  const updateMeta = () => {
    const s = services[active];
    if (!s) return;
    if (cap) cap.textContent = s.cap;
    if (idx) idx.textContent = `0${active + 1} / 0${services.length}`;
    if (title) title.textContent = s.stories[scene] || '';
    if (counter) counter.textContent = `${scene + 1} / ${SCENES}`;
  };
  const updateBars = progress => {
    bars.forEach((bar, i) => {
      const w = i < scene ? 100 : i === scene ? progress * 100 : 0;
      bar.style.width = `${w.toFixed(1)}%`;
    });
  };

  const setAccordion = index => {
    items.forEach((item, i) => {
      const open = i === index;
      item.classList.toggle('is-open', open);
      must('.service-toggle-btn', item).setAttribute('aria-expanded', String(open));
    });
  };

  /** @type {{ reset: () => void } | null} */
  let story = null;
  const setService = index => {
    if (index < 0 || index >= items.length) return;
    active = index;
    scene = 0;
    if (story) story.reset();
    items.forEach((item, i) => item.classList.toggle('is-active', i === index));
    if (field) {
      field.show(index * SCENES);
      if (field.W && !motion.paused) field.pulse(field.W / 2, field.H / 2, 8);
    }
    updateMeta();
    updateBars(0);
  };

  const step = delta => {
    const next = (active + delta + items.length) % items.length;
    setService(next);
    if (!isDesktop()) setAccordion(next);
  };

  items.forEach((item, i) => {
    const btn = must('.service-toggle-btn', item);
    btn.addEventListener('click', () => {
      const wasOpen = item.classList.contains('is-open');
      setService(i);
      setAccordion(wasOpen ? -1 : i);
    });
    btn.addEventListener('focus', () => { if (active !== i) setService(i); });
    item.addEventListener('mouseenter', () => {
      if (media('fine').matches && isDesktop() && active !== i) setService(i);
    });
  });

  const cv = $('#services-canvas');
  if (cv) {
    field = createField(cv, {
      per: 60,
      max: 2800,
      preventScrollOnSwipe: true,
      onSwipe: dir => step(dir === 'left' ? 1 : -1),
    });
    field.setDraws(stories.flat());
    field.show(0);
  }

  const card = $('#services-stage-card');
  if (card) {
    story = storyLoop(card, () => {
      scene = (scene + 1) % SCENES;
      if (field) {
        field.show(active * SCENES + scene);
        if (field.W) field.pulse(field.W / 2, field.H / 2, 5);
      }
      updateMeta();
    }, updateBars);
  }
  updateMeta();
}

/** Leistungsseite: die vier Szenen der Leistung als ruhige Illustration. */
export function initServicePage() {
  const cv = $('#service-canvas');
  if (!cv || typeof data.service !== 'number') return;
  const base = data.service * SCENES;
  let scene = 0;
  const field = createField(cv, { per: 60, max: 2800, threshold: 0.2 });
  field.setDraws(stories.flat());
  field.show(base);
  storyLoop(cv, () => {
    scene = (scene + 1) % SCENES;
    field.show(base + scene);
  });
}
