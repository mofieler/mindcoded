// Vorhang beim Projektwechsel: Eingang, Ausgang, Seite darunter inert. (Hochzählen: unit.js)
// Ausgeführt von tests/test_browser.py; Ergebnis als JSON in #result (Liste der Probleme).

const wait = ms => new Promise(r => setTimeout(r, ms));
const problems = [];
const check = (ok, text) => { if (!ok) problems.push(text); };

function frame(width = 1280, height = 900) {
  const f = document.createElement('iframe');
  f.style.width = `${width}px`;
  f.style.height = `${height}px`;
  document.getElementById('frames').appendChild(f);
  return f;
}

const load = (f, src) => new Promise(resolve => { f.onload = resolve; f.src = src; });

async function curtain() {
  const f = frame();
  // Eingang: Ankunft per Link von einer anderen Seite der Website → startet unter dem Vorhang
  await load(f, '../projekte/paquita-pilates/');
  let root = f.contentDocument.documentElement;
  check(root.classList.contains('curtain-in'), 'Eingang: kein Vorhang nach Ankunft von einer anderen Seite');
  check(f.contentDocument.querySelector('main').inert === true, 'Eingang: Seite unter dem Vorhang nicht inert');
  // CSS-Animationen laufen im Testbrowser (virtuelle Zeit) nicht – ihr Ende wird gemeldet wie im Browser.
  f.contentDocument.querySelector('[data-curtain]').dispatchEvent(new f.contentWindow.AnimationEvent('animationend', { bubbles: true }));
  await wait(1200);
  check(!root.classList.contains('curtain-in'), 'Eingang: Vorhang nach dem Heben nicht aufgeräumt');
  check(f.contentDocument.querySelector('main').inert === false, 'Eingang: Seite nach dem Vorhang noch inert');

  // Ausgang: Klick auf »Nächstes Projekt« → Vorhang mit Titel des Ziels, Seite inert, dann Wechsel
  const next = f.contentDocument.querySelector('.case-next-btn');
  const target = next.getAttribute('data-curtain-title');
  const arrived = new Promise(resolve => { f.onload = resolve; });
  next.click();
  await wait(150);
  root = f.contentDocument.documentElement;
  check(root.classList.contains('curtain-out'), 'Ausgang: Vorhang fährt nicht hoch');
  check(f.contentDocument.querySelector('[data-curtain-title]').textContent === target, 'Ausgang: Titel des Ziels fehlt');
  check(f.contentDocument.querySelector('main').inert === true, 'Ausgang: Seite während des Vorhangs bedienbar');
  await arrived;
  check(f.contentWindow.location.pathname.endsWith('/pilateq/'), `Ausgang: falsches Ziel ${f.contentWindow.location.pathname}`);
  check(f.contentDocument.documentElement.classList.contains('curtain-in'), 'Ausgang: Ziel startet nicht unter dem Vorhang');
  f.remove();
}

async function run() {
  for (const step of [curtain]) {
    try { await step(); } catch (err) { problems.push(`${step.name}: ${err}`); }
  }
  document.getElementById('result').textContent = JSON.stringify({ problems });
}

run();
