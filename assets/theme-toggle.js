// @ts-check
/**
 * mindcoded.studio — Farbschema-Schalter. Eigene Wahl wird gespeichert (localStorage »mc-theme«),
 * die Rückkehr zur Voreinstellung löscht sie wieder (Logik: theme.js). Ohne eigene Wahl folgt
 * die Seite dem System, auch wenn es während des Besuchs wechselt.
 */

import { $$, fields, root, state } from './context.js';
import { defaultTheme, themeToStore } from './theme.js';
import { dotPalette } from './tokens.js';

const isDark = () => root.getAttribute('data-theme') === 'dark';

export function initTheme() {
  const buttons = $$('[data-action="toggle-theme"]');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  let rotation = 0;

  const repaint = () => {
    buttons.forEach(btn => btn.setAttribute('aria-pressed', String(isDark())));
    if (state.hero) state.hero.refreshColors();
    fields.forEach(f => f.setColors(dotPalette(f.onNavy)));
  };
  const setTheme = (theme, persist) => {
    root.setAttribute('data-theme', theme);
    if (persist) {
      // Entspricht die Wahl der Voreinstellung, wird nichts gespeichert: die Seite folgt wieder dem System.
      const keep = themeToStore(theme, defaultTheme(root.dataset.themeDefault, systemDark.matches));
      try {
        if (keep) localStorage.setItem('mc-theme', keep);
        else localStorage.removeItem('mc-theme');
      } catch (e) { /* ohne Speicher: gilt nur für diese Seite */ }
    }
    repaint();
  };

  buttons.forEach(btn => btn.addEventListener('click', () => {
    rotation += 180;
    $$('[data-theme-rot]').forEach(el => { el.style.transform = `rotate(${rotation}deg)`; });
    setTheme(isDark() ? 'light' : 'dark', true);
  }));

  // Folgt dem System, solange niemand selbst umgeschaltet hat.
  systemDark.addEventListener('change', e => {
    /** @type {string | null} */
    let stored = null;
    try { stored = localStorage.getItem('mc-theme'); } catch (err) { /* ohne Speicher */ }
    if (!stored && root.dataset.themeDefault === 'system') setTheme(e.matches ? 'dark' : 'light', false);
  });
  repaint();
}
