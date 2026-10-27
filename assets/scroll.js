// @ts-check
/**
 * mindcoded.studio — beim Scrollen: Lesefortschritt, Parallax im Hero, schwebender Anfrage-Button.
 * Ein gemeinsamer, gedrosselter Durchlauf je Frame.
 *
 * Der Kontaktbereich schließt bündig an: Kein Einzug, keine runden Ecken – sonst blitzt beim
 * Scrollen der Seitengrund links, rechts und zwischen den Abschnitten hervor.
 */

import { $, $$, isDesktop, motion, root } from './context.js';

export function initScroll() {
  const progress = $('#progress-bar');
  const heroInner = $('#hero-inner');
  const heroSec = $('#hero');
  const contact = $('#kontakt');
  const projects = $('#projekte');
  const fab = $('#mobile-fab');
  // Andere Anfrage-Buttons im Bild machen den schwebenden überflüssig (keine doppelte Aktion).
  const ctas = fab ? $$('main .btn-primary-pill') : [];
  let lastY = window.scrollY;
  let ticking = false;

  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - vh;
    if (progress && max > 0) progress.style.width = `${Math.min(100, (y / max) * 100).toFixed(2)}%`;

    if (heroInner) {
      if (motion.paused) {
        heroInner.style.transform = '';
        heroInner.style.opacity = '';
      } else {
        const p = Math.min(1, y / vh);
        heroInner.style.transform = `translateY(${(p * vh * 0.18).toFixed(1)}px)`;
        heroInner.style.opacity = Math.max(0, 1 - p * 1.1).toFixed(3);
      }
    }

    if (fab) {
      // Nur auf kleinen Bildschirmen, nach dem Hero, nie über Projekten oder dem Formular
      // und nicht während einer Eingabe (Bildschirmtastatur).
      const pastHero = heroSec ? heroSec.getBoundingClientRect().bottom < vh * 0.25 : y > vh * 0.7;
      const overProjects = projects ? (() => { const r = projects.getBoundingClientRect(); return r.top < vh && r.bottom > 0; })() : false;
      const nearContact = contact ? contact.getBoundingClientRect().top < vh * 0.9 : false;
      const typing = document.activeElement && document.activeElement.matches('input, textarea, select');
      const otherCta = ctas.some(el => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < vh; });
      const show = !isDesktop() && pastHero && !overProjects && !nearContact && !otherCta && !typing && !root.classList.contains('menu-open');
      fab.classList.toggle('is-visible', show);
      // Weiterlesen (nach unten) → nur Pfeilkreis; zurück (nach oben) → mit Text. Kleine Bewegungen ignorieren.
      if (Math.abs(y - lastY) > 24) {
        fab.classList.toggle('is-compact', y > lastY);
        lastY = y;
      }
    }

  };
  const request = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request, { passive: true });
  document.addEventListener('focusin', request);
  document.addEventListener('focusout', request);
  motion.on(request);
  update();
}
