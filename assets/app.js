// @ts-check
/**
 * mindcoded.studio — Interaktion (Progressive Enhancement), Einstieg.
 *
 * Alle Inhalte stehen bereits im ausgelieferten HTML (erzeugt von tools/build.py). Die Bausteine
 * ergänzen nur Verhalten; fällt einer aus, laufen die anderen weiter, und die Seite bleibt
 * vollständig lesbar und bedienbar.
 *
 *   context.js       gemeinsamer Zustand: Seitendaten, Breakpoints, Pause, Punktwolken
 *   motion.js        Animationen anhalten (WCAG 2.2.2)
 *   theme-toggle.js  Farbschema
 *   header.js        mitlaufender Header, aktueller Abschnitt
 *   menu.js          Mobilmenü
 *   hero.js          Hero-Animation, Start-Intro, Logo, Schreibeffekt
 *   services.js      Leistungen und Leistungsseiten
 *   projects.js      Projekte, Case Study (Kapitelanzeige, Bildstreifen, Zahlen), Seitenübergänge
 *   contact.js       Kontaktbereich und Formular (contact-form.js)
 *   transitions.js   Seitenwechsel als Vorhang (Folienübergang)
 *   video.js         Video erst nach Klick laden (Zwei-Klick-Lösung, Datenschutz)
 *   scroll.js        Fortschritt, Parallax, schwebender Button
 *   smooth-scroll.js sanftes Scrollen mit Mausrad und bei Sprüngen zu Abschnitten
 *   effects.js       magnetische Buttons, Einblenden
 *   copy.js          Kopieren-Knöpfe (Komponenten-Seite)
 *   analytics.js     Besucherstatistik: gelesene Abschnitte, Formular-Ereignisse (ohne Inhalte)
 *
 * Farben und Breakpoints stehen nur in assets/css/settings/ (tokens.js liest sie).
 * Der Build lädt alle Module per modulepreload parallel vor (keine Kette von Anfragen).
 */

import { root, state } from './context.js';
import { initMotion } from './motion.js';
import { initTheme } from './theme-toggle.js';
import { initHeader, initScrollSpy } from './header.js';
import { initMenu } from './menu.js';
import { initHero, initLogo, initTypewriter } from './hero.js';
import { initServices, initServicePage } from './services.js';
import { initCasePage, initChapters, initCountUp, initGallery, initProjects, initViewTransitions } from './projects.js';
import { initContact } from './contact.js';
import { initScroll } from './scroll.js';
import { initCurtain } from './transitions.js';
import { initVideo } from './video.js';
import { initSmoothScroll } from './smooth-scroll.js';
import { initMagnets, initReveal } from './effects.js';
import { initCopy } from './copy.js';
import { initSectionViews } from './analytics.js';

const STEPS = [initMotion, initTheme, initHeader, initScrollSpy, initMenu, initHero, initLogo, initTypewriter,
  initServices, initServicePage, initProjects, initCasePage, initChapters, initGallery, initCountUp, initViewTransitions, initCurtain, initVideo, initContact, initScroll,
  initSmoothScroll, initMagnets, initReveal, initCopy, initSectionViews];

function boot() {
  const failed = [];
  for (const step of STEPS) {
    try {
      step();
    } catch (err) {
      failed.push(`${step.name}: ${err instanceof Error ? err.message : String(err)}`);
      console.error(`[mindcoded] ${step.name} fehlgeschlagen:`, err);
    }
  }
  // Ohne laufende Hero-Animation darf der Inhalt nie verborgen bleiben.
  if (!state.hero) root.classList.remove('intro-pending');
  // Zustand für Tests und Fehlersuche (enthält keine Nutzerdaten).
  root.dataset.app = failed.length ? 'degraded' : 'ready';
  if (failed.length) root.dataset.appErrors = failed.join(' | ');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
