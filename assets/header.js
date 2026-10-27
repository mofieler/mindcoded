// @ts-check
/**
 * mindcoded.studio — mitlaufender Header und aktueller Abschnitt in der Navigation.
 *
 * Oben auf der Seite liegt der Header ganz normal über dem Inhalt. Nach dem Scrollen wird er
 * fixiert, bleibt beim Weiterscrollen verborgen und erscheint, sobald man zurückscrollt –
 * so sind Navigation und »Projekt anfragen« jederzeit erreichbar, ohne Inhalt zu verdecken.
 */

const SCROLL_DELTA = 6; // px, darunter zählt eine Bewegung nicht als Richtungswechsel

/**
 * Reine Zustandsfunktion (in tests/browser/unit.js getestet).
 * @param {{floating: boolean, shown: boolean, lastY: number}} state
 * @param {number} y aktuelle Scrollposition
 * @param {number} threshold ab hier wird der Header fixiert
 */
export function nextHeaderState(state, y, threshold) {
  if (y <= threshold) return { floating: false, shown: false, lastY: y };
  const delta = y - state.lastY;
  let shown = state.floating ? state.shown : false;
  if (delta <= -SCROLL_DELTA) shown = true;
  else if (delta >= SCROLL_DELTA) shown = false;
  else return { ...state, floating: true, shown };
  return { floating: true, shown, lastY: y };
}

export function initHeader() {
  const header = /** @type {HTMLElement | null} */ (document.querySelector('[data-header]'));
  if (!header) return;
  const root = document.documentElement;
  let state = { floating: false, shown: false, lastY: window.scrollY };
  let ticking = false;

  const apply = next => {
    if (next.floating !== state.floating) {
      // Beim Umschalten zwischen »über dem Inhalt« und »fixiert« nicht animieren.
      header.classList.add('no-anim');
      requestAnimationFrame(() => requestAnimationFrame(() => header.classList.remove('no-anim')));
    }
    header.classList.toggle('is-floating', next.floating);
    header.classList.toggle('is-shown', next.floating && next.shown);
    root.classList.toggle('header-shown', next.floating && next.shown);
    state = next;
  };

  const update = () => {
    ticking = false;
    if (root.classList.contains('menu-open')) return;
    apply(nextHeaderState(state, window.scrollY, header.offsetHeight + 24));
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  update();
}

/** Markiert den Navigationslink des Abschnitts, der gerade im Blick ist (aria-current). */
export function initScrollSpy() {
  const links = /** @type {HTMLAnchorElement[]} */ ([...document.querySelectorAll('a[data-spy]')]);
  if (!links.length || !('IntersectionObserver' in window)) return;
  const sections = [...new Set(links.map(a => a.dataset.spy))]
    .map(id => document.getElementById(id || ''))
    .filter(/** @returns {el is HTMLElement} */ el => el !== null);

  const mark = id => {
    links.forEach(a => {
      const current = a.dataset.spy === id;
      a.classList.toggle('is-current', current);
      if (current) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  };

  // Ein Abschnitt gilt als aktuell, wenn er das mittlere Band des Fensters kreuzt.
  const io = new IntersectionObserver(entries => {
    const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
    if (visible.length) mark(visible[0].target.id);
    else if (window.scrollY < window.innerHeight * 0.5) mark(null);
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(section => io.observe(section));
}
