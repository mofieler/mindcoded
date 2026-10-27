// Barrierefreiheit: lädt jede Seitenart in ein iframe, deckt alle Einblende-Effekte auf und prüft
// mit axe-core (vendor/, MPL-2.0) gegen WCAG 2.0, 2.1 und 2.2 in den Stufen A und AA.
// Ausgeführt von tests/test_browser.py; Ergebnis als JSON in #result.

const PAGES = ['../', '../en/', '../projekte/paquita-pilates/', '../projekte/hiqer/', '../leistungen/websites/',
  '../impressum/', '../datenschutz/', '../kontakt/danke/', '../komponenten/'];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
// Ausgenommen: die Wortmarke im Logo (WCAG 1.4.3 nimmt Logos vom Kontrast aus) und Markierungen,
// die es nur im Entwicklungs-Build gibt (offene Angaben, Hinweisleiste).
const EXCLUDE = [['.brand-tld'], ['mark.todo'], ['.dev-badge']];
const wait = ms => new Promise(r => setTimeout(r, ms));

async function audit(page) {
  const frame = document.createElement('iframe');
  frame.style.width = '1280px';
  frame.style.height = '900px';
  document.getElementById('frames').appendChild(frame);
  await new Promise(resolve => { frame.onload = resolve; frame.src = page; });
  const doc = frame.contentDocument;
  doc.querySelectorAll('[data-rv]').forEach(el => el.classList.add('is-revealed'));
  doc.documentElement.classList.remove('intro-pending');
  // Übergänge abschalten, damit nichts mitten im Einblenden gemessen wird (CSSOM, CSP-konform)
  const still = new frame.contentWindow.CSSStyleSheet();
  still.replaceSync('*, *::before, *::after { transition: none !important; animation: none !important; }');
  doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, still];
  await new Promise((resolve, reject) => {
    const s = doc.createElement('script');
    s.src = new URL('vendor/axe.min.js', location.href).href;
    s.onload = resolve;
    s.onerror = () => reject(new Error('axe nicht geladen'));
    doc.head.appendChild(s);
  });
  await wait(1500); // Übergänge und Hochzählen abwarten
  const result = await frame.contentWindow.axe.run({ include: [doc], exclude: EXCLUDE },
    { runOnly: { type: 'tag', values: TAGS }, resultTypes: ['violations'] });
  frame.remove();
  return result.violations.map(v => ({
    page, rule: v.id, impact: v.impact, help: v.help,
    nodes: v.nodes.slice(0, 3).map(n => n.target.join(' ')),
  }));
}

async function run() {
  const violations = [];
  for (const page of PAGES) {
    try {
      violations.push(...await audit(page));
    } catch (err) {
      violations.push({ page, rule: 'harness', help: String(err) });
    }
  }
  document.getElementById('result').textContent = JSON.stringify({ checked: PAGES.length, violations });
}

run();
