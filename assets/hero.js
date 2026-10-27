// @ts-check
/**
 * mindcoded.studio — Hero: Punktwolke mit Start-Intro, Logo-Easter-Egg, Schreibeffekt in der H1.
 */

import { $, data, isDesktop, motion, root, state } from './context.js';
import { HeroCanvas } from './hero-canvas.js';
import { MCEgg } from './logo-egg.js';
import { scrollToTarget } from './smooth-scroll.js';
import { heroColors } from './tokens.js';

export function initHero() {
  const section = $('#hero');
  const canvas = $('#hero-canvas');
  if (!section || !(canvas instanceof HTMLCanvasElement)) return;
  const header = $('.site-header');
  const hero = new HeroCanvas(section, canvas, {
    lang: (data.lang || 'de').toUpperCase(),
    getColors: heroColors,
    isWide: isDesktop,
    paused: motion.paused,
    topInset: () => (header ? header.getBoundingClientRect().bottom - section.getBoundingClientRect().top + 48 : 0),
    onIntroEnd: () => {
      root.classList.remove('intro-pending');
      section.classList.add('intro-complete');
    },
  });
  state.hero = hero;
  // Zeitbasiertes Ende als Absicherung, falls der Browser Animationsframes drosselt
  // (Energiesparmodus, Hintergrund) – der Inhalt bleibt nie länger als 5 s verborgen.
  if (root.classList.contains('intro-pending')) {
    setTimeout(() => {
      if (!root.classList.contains('intro-pending')) return;
      hero.skipIntro();
      root.classList.remove('intro-pending');
      section.classList.add('intro-complete');
    }, 5000);
  }
}

export function initLogo() {
  const logo = $('#site-logo');
  if (!logo || data.page !== 'home') return;
  logo.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    scrollToTarget(0);
    if (MCEgg && !motion.paused) {
      const { ink, accent } = heroColors();
      MCEgg.run(logo, { ink, accent });
    }
  });
}

export function initTypewriter() {
  const el = $('[data-typed]');
  const words = data.words;
  if (!el || !Array.isArray(words) || words.length < 2) return;

  // Der zugängliche Name der H1 bleibt stabil: Screenreader hören immer den vollständigen
  // ersten Begriff, die animierte Zeile ist rein visuell.
  const row = el.closest('.typed-row');
  if (!row) return;
  const stable = document.createElement('span');
  stable.className = 'visually-hidden';
  stable.textContent = el.textContent;
  row.after(stable);
  row.setAttribute('aria-hidden', 'true');

  let wordIdx = 0;
  let charIdx = words[0].length;
  let typing = false;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  let visible = true;

  const tick = () => {
    const word = words[wordIdx];
    let delay;
    if (typing) {
      if (charIdx < word.length) { charIdx += 1; delay = 65 + Math.random() * 55; }
      else { typing = false; delay = 2400; }
    } else if (charIdx > 0) {
      charIdx -= 1; delay = 30;
    } else {
      typing = true; wordIdx = (wordIdx + 1) % words.length; delay = 360;
    }
    el.textContent = words[wordIdx].slice(0, charIdx);
    timer = setTimeout(tick, delay);
  };

  const stop = () => {
    clearTimeout(timer);
    timer = undefined;
    // Angehalten wird immer auf einem vollständigen Wort.
    charIdx = words[wordIdx].length;
    typing = false;
    el.textContent = words[wordIdx];
  };
  const start = () => {
    if (timer || motion.paused || !visible) return;
    timer = setTimeout(tick, 2400);
  };

  new IntersectionObserver(entries => {
    visible = entries.some(e => e.isIntersecting);
    if (visible) start(); else stop();
  }).observe(el);
  motion.on(paused => (paused ? stop() : start()));
  start();
}
