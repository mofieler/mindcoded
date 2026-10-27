// Layout-Test für Handy, Tablet und Desktop: lädt jede Seitenart in typischen Breiten in ein
// iframe (dort greifen die Media Queries der jeweiligen Breite) und prüft auf horizontales
// Überlaufen. Ausgeführt von tests/test_browser.py; Ergebnis als JSON in #result.

const WIDTHS = [360, 390, 768, 834, 1024, 1280, 1920];
const PAGES = ['../', '../en/', '../leistungen/websites/', '../projekte/paquita-pilates/', '../impressum/'];
const wait = ms => new Promise(r => setTimeout(r, ms));

function check(frame) {
  const doc = frame.contentDocument;
  const width = doc.documentElement.clientWidth;
  const overflowing = [];
  // Gewollt waagerecht scrollende Bereiche (wischbare Reihen, Bildstreifen) dürfen Inhalt außerhalb
  // des Bildschirms haben – entscheidend ist, dass die Seite selbst nicht seitlich scrollt.
  const win = frame.contentWindow;
  const scrollers = [...doc.querySelectorAll('body *')]
    .filter(el => ['auto', 'scroll'].includes(win.getComputedStyle(el).overflowX));
  for (const el of doc.querySelectorAll('body *')) {
    // .tools-viewport: Laufband, absichtlich breiter als der Bildschirm und beschnitten
    if (el.closest('[hidden], .visually-hidden, .hp-field, .skip-link, #mobile-menu, .mobile-fab-btn, canvas, .dev-badge, .tools-viewport')) continue;
    if (scrollers.some(s => s !== el && s.contains(el))) continue;
    const r = el.getBoundingClientRect();
    if (r.width && (r.right > width + 1 || r.left < -1)) {
      overflowing.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} (${Math.round(r.left)}–${Math.round(r.right)})`);
    }
  }
  return {
    scroll: doc.documentElement.scrollWidth > width + 1,
    overflowing: overflowing.slice(0, 5),
    app: doc.documentElement.dataset.app || null,
  };
}

async function run() {
  const problems = [];
  let checked = 0;
  const host = document.getElementById('frames');
  for (const page of PAGES) {
    for (const width of WIDTHS) {
      const frame = document.createElement('iframe');
      frame.style.width = `${width}px`;
      frame.style.height = '900px';
      frame.style.border = '0';
      host.appendChild(frame);
      await new Promise(resolve => { frame.onload = resolve; frame.src = page; });
      await wait(400);
      const result = check(frame);
      checked += 1;
      if (result.scroll || result.overflowing.length || result.app !== 'ready') {
        problems.push({ page, width, ...result });
      }
      frame.remove();
    }
  }
  document.getElementById('result').textContent = JSON.stringify({ checked, problems });
  document.documentElement.dataset.done = '1';
}

run();
