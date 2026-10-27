// @ts-check
/**
 * mindcoded.studio — Design-Tokens und Breakpoints zur Laufzeit.
 *
 * Farben kommen aus den Custom Properties in assets/css/settings/tokens.css (einzige Quelle),
 * Breakpoints aus den @custom-media-Regeln in settings/media.css, die der Build in die
 * Seitendaten schreibt. So muss keine
 * Farbe und kein Breakpoint im JavaScript doppelt gepflegt werden.
 */

const root = document.documentElement;

/** Wert einer CSS-Custom-Property (ohne »--«) im aktuellen Farbschema. */
export function token(name) {
  return getComputedStyle(root).getPropertyValue(`--${name}`).trim();
}

/** Farben für Punktwolken: [Grundfarbe, Akzent, weicher Akzent]. */
export function dotPalette(onNavy = false) {
  return onNavy
    ? [token('color-navy-fg'), token('color-accent'), token('color-accent-soft-navy')]
    : [token('color-ink'), token('color-accent'), token('color-accent-soft')];
}

/** Farben für die Hero-Animation und das Logo-Easter-Egg. */
export function heroColors() {
  return { ink: token('color-ink'), accent: token('color-accent'), accentSoft: token('color-accent-soft') };
}

/**
 * MediaQueryList für einen Breakpoint aus settings/media.css (z. B. 'desktop', 'header-full', 'fine').
 * Unbekannte Namen liefern eine Abfrage, die nie zutrifft – Fehler fallen so sichtbar auf.
 */
export function createMedia(map = {}) {
  const cache = new Map();
  return name => {
    if (!cache.has(name)) {
      const query = map[name];
      if (!query) console.warn(`[mindcoded] unbekannter Breakpoint »${name}«`);
      cache.set(name, window.matchMedia(query || 'not all'));
    }
    return cache.get(name);
  };
}
