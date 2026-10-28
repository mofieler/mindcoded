// @ts-check
/**
 * mindcoded.studio — Seitenwechsel als Vorhang, wie ein Folienübergang. Ein Konzept für alle Wechsel
 * innerhalb der Website: zu Projekten, zurück zur Projektliste und aus dem Menü von Unterseiten
 * in einen Abschnitt der Startseite.
 *
 * Ausgang (hier): Klick auf einen Link mit [data-curtain-link] → der Vorhang fährt von unten hoch,
 * Nummer, Art, Linie und der Titel (Wort für Wort) des Ziels steigen ein, dann folgt der Seitenwechsel.
 * Eingang (theme-init.js, vor dem ersten Zeichnen): Die neue Seite startet unter demselben Vorhang;
 * Titel und Vorhang heben sich per CSS (layout/curtain.css) – ohne JavaScript-Abhängigkeit.
 *
 * Normale Navigation bei angehaltenen Animationen, Klick mit Zusatztaste (neuer Tab) und fremden
 * Zielen. Kommt eine Seite über »Zurück« aus dem Browser-Cache, verdeckt sie kein Vorhang.
 */

import { $, closest, motion, root } from './context.js';

const COVER_MS = 900;
const FAILSAFE_MS = 3200;
const FIELDS = ['index', 'kicker', 'sub'];

/**
 * Titel Wort für Wort in Masken setzen – derselbe Aufbau wie layout.py › curtain_body.
 * @param {HTMLElement} title
 * @param {string} text
 */
function setTitle(title, text) {
  title.replaceChildren(...text.split(/\s+/).filter(Boolean).flatMap((word, i) => {
    const mask = document.createElement('span');
    mask.className = 'curtain-word';
    const inner = document.createElement('span');
    inner.textContent = word;
    mask.append(inner);
    return i ? [document.createTextNode(' '), mask] : [mask];
  }));
}

/** Während der Vorhang verdeckt, ist die Seite darunter weder fokussier- noch klickbar. */
function setInert(curtain, on) {
  [...document.body.children].forEach(el => { if (el !== curtain) /** @type {HTMLElement} */ (el).inert = on; });
}

export function initCurtain() {
  const curtain = $('[data-curtain]');
  if (!curtain) return;

  if (root.classList.contains('curtain-in')) {
    setInert(curtain, true);
    setTimeout(() => setInert(curtain, false), FAILSAFE_MS);
  }
  // Bedienbar, sobald der Vorhang oben ist; die Klasse erst entfernen, wenn auch der nachsteigende
  // Seitenkopf fertig ist (curtain.css › curtain-content).
  curtain.addEventListener('animationend', e => {
    if (e.target === curtain && root.classList.contains('curtain-in')) {
      setInert(curtain, false);
      setTimeout(() => root.classList.remove('curtain-in'), 1000);
    }
  });
  window.addEventListener('pageshow', e => {
    if (!e.persisted) return;
    root.classList.remove('curtain-out', 'curtain-in');
    setInert(curtain, false);
  });
  // Der Vorhang ist der Übergang – den weichen Standard-Übergang des Browsers dann auslassen.
  window.addEventListener('pageswap', e => {
    const vt = /** @type {any} */ (e).viewTransition;
    if (vt && root.classList.contains('curtain-out')) vt.skipTransition();
  });

  document.addEventListener('click', e => {
    const link = /** @type {HTMLAnchorElement | null} */ (closest(e, 'a[data-curtain-link]'));
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (motion.paused || root.classList.contains('curtain-out')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;
    e.preventDefault();
    // Ausgang zeigt immer den ersten Inhalt (»default«), gefüllt mit den Angaben des Links
    const body = $('[data-curtain-body="default"]', curtain);
    if (body) {
      FIELDS.forEach(key => {
        const field = $(`[data-curtain-${key}]`, body);
        if (field) field.textContent = link.getAttribute(`data-curtain-${key}`) || '';
      });
      const title = $('[data-curtain-title]', body);
      if (title) setTitle(title, link.getAttribute('data-curtain-title') || '');
    }
    root.removeAttribute('data-curtain-target');
    root.classList.remove('curtain-in');
    root.classList.add('curtain-out');
    setInert(curtain, true);
    setTimeout(() => { location.href = url.href; }, COVER_MS);
  });
}
