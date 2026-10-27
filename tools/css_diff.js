/**
 * CSS-Vergleich – ausgeführt von tools/css_diff.py.
 *
 * Lädt jede Seite aus zwei Build-Ständen (»baseline« und »current«) in iframes ohne
 * JavaScript, versetzt beide in denselben Zustand und vergleicht die berechneten Stile jedes
 * Elements samt ::before/::after. Gleiches DOM, gleicher Zeitpunkt – also kein Rauschen durch
 * Animationen oder Zufall.
 *
 * - Hover und Fokus: »:hover«, »:focus-visible« … werden im CSS-Text auf Klassen umgeschrieben
 *   und an allen Elementen gesetzt.
 * - Nutzereinstellungen (reduzierte Bewegung, Touch, mehr Kontrast, Windows-Kontrastmodus,
 *   Druck): die Media-Abfragen werden im CSS-Text fest auf »trifft zu« bzw. »trifft nicht zu«
 *   gesetzt.
 * - Übergänge und Animationen sind beim Messen abgeschaltet; ihre Werte selbst vergleicht ein
 *   zweiter Durchgang.
 */

const params = new URLSearchParams(location.search);
const PAGES = params.get('pages').split(',').map(p => (p === '-' ? '' : p));
const QUICK = params.get('quick') === '1';
const SIZES = QUICK ? [[390, 844], [1280, 800]]
  : [[360, 780], [390, 844], [600, 900], [834, 1112], [1024, 768], [1180, 820], [1280, 800], [1920, 1080]];
const STATE_SIZES = QUICK ? SIZES : [[390, 844], [834, 1112], [1280, 800]];
const MAX_DIFFS = 5000;
const MOTION = /^(transition|animation)/;
const HARNESS = '__';

// Ausgangslage: Desktop-Browser mit Maus, ohne besondere Systemeinstellungen
const FEATURES = {
  'prefers-reduced-motion: reduce': false,
  'prefers-reduced-motion: no-preference': true,
  'pointer: coarse': false,
  'pointer: fine': true,
  'hover: hover': true,
  'hover: none': false,
  'prefers-contrast: more': false,
  'forced-colors: active': false,
};

const add = (doc, selector, ...classes) => doc.querySelectorAll(selector).forEach(el => el.classList.add(...classes));
const attr = (doc, selector, name, value) => doc.querySelectorAll(selector).forEach(el => el.setAttribute(name, value));

// Zustandsklassen in alter und neuer Schreibweise, damit auch Stände vor und nach einer
// Umbenennung vergleichbar bleiben.
function openAll(doc) {
  add(doc, '.service-accordion-item', 'expanded', 'active', 'is-open', 'is-active');
  add(doc, '.project-item', 'open', 'is-open');
  doc.querySelectorAll('details').forEach(el => { el.open = true; });
  add(doc, '.mobile-overlay-menu', 'open', 'is-open');
  add(doc, 'html', 'menu-open');
  add(doc, '.mobile-fab-btn', 'visible', 'is-visible');
  add(doc, '[data-rv]', 'revealed', 'is-revealed');
  add(doc, '.desktop-nav a, .menu-link-item', 'is-current');
  doc.querySelectorAll('.topic-chip input').forEach((el, i) => { el.checked = i % 2 === 0; });
  doc.querySelectorAll('.form-status').forEach(el => { el.textContent = 'Status'; el.classList.add('is-error'); });
  attr(doc, '.form-input, .form-textarea', 'aria-invalid', 'true');
  attr(doc, '.contact-form-card', 'aria-busy', 'true');
  attr(doc, '.btn-contact-submit', 'aria-disabled', 'true');
  attr(doc, '[data-motion-toggle]', 'aria-pressed', 'true');
}

const STATES = [
  { name: 'ohne-js', js: false },
  { name: 'js', js: true },
  { name: 'offen', js: true, setup: openAll },
  { name: 'header-fixiert', js: true, setup: doc => {
    add(doc, '[data-header]', 'is-floating', 'is-shown');
    add(doc, 'html', 'header-shown');
    doc.querySelectorAll('.form-status').forEach(el => { el.textContent = 'Status'; });
  } },
  { name: 'header-versteckt', js: true, setup: doc => add(doc, '[data-header]', 'is-floating', 'no-anim') },
  { name: 'intro', js: true, setup: doc => add(doc, 'html', 'intro-pending') },
  { name: 'pausiert', js: true, setup: doc => add(doc, 'html', 'motion-paused') },
  { name: 'dunkel', js: true, theme: 'dark', setup: openAll },
  { name: 'hover', js: true, hover: true, setup: openAll },
  { name: 'fokus', js: true, focus: true },
  { name: 'reduzierte-bewegung', js: true, setup: openAll,
    features: { 'prefers-reduced-motion: reduce': true, 'prefers-reduced-motion: no-preference': false } },
  { name: 'touch', js: true, setup: openAll,
    features: { 'pointer: coarse': true, 'pointer: fine': false, 'hover: hover': false, 'hover: none': true } },
  { name: 'mehr-kontrast', js: true, setup: openAll, features: { 'prefers-contrast: more': true } },
  { name: 'mehr-kontrast-dunkel', js: true, theme: 'dark', setup: openAll, features: { 'prefers-contrast: more': true } },
  { name: 'kontrastmodus', js: true, setup: openAll, features: { 'forced-colors: active': true } },
  { name: 'druck', js: true, print: true, setup: openAll },
];
const BASIC = new Set(['ohne-js', 'js']);

const cssCache = new Map();

async function cssText(url) {
  if (!cssCache.has(url)) cssCache.set(url, fetch(url).then(r => r.text()));
  return cssCache.get(url);
}

function featureRe(feature) {
  const [name, value] = feature.split(':').map(s => s.trim());
  return new RegExp(`\\(\\s*${name}\\s*:\\s*${value}\\s*\\)`, 'g');
}

/** CSS für einen Zustand: Abfragen festlegen, Pseudoklassen umschreiben, Schrift-URLs absolut. */
function transform(css, base, state) {
  const features = { ...FEATURES, ...(state.features || {}) };
  for (const [feature, on] of Object.entries(features)) {
    css = css.replace(featureRe(feature), on ? '(min-width: 0px)' : '(max-width: 0px)');
  }
  if (state.print) css = css.replace(/@media\s+print\b/g, '@media all');
  css = css
    .replace(/:hover\b/g, `.${HARNESS}h`)
    .replace(/:focus-visible\b/g, `.${HARNESS}fv`)
    .replace(/:focus-within\b/g, `.${HARNESS}fw`)
    .replace(/:focus\b(?!-)/g, `.${HARNESS}f`);
  return css.replace(/url\((['"]?)(?!data:|https?:|\/)([^'")]+)\1\)/g, (m, q, path) => `url("${new URL(path, base)}")`);
}

const KILL = `@layer ${HARNESS}kill { *, *::before, *::after, *::marker, *::placeholder {
  transition: none !important; animation: none !important; } }`;

async function load(frame, url) {
  await new Promise(resolve => { frame.onload = resolve; frame.src = url; });
  return frame.contentDocument;
}

async function prepare(doc, state) {
  const root = doc.documentElement;
  root.classList.remove('no-js', 'js');
  root.classList.add(state.js ? 'js' : 'no-js');
  root.setAttribute('data-theme', state.theme || 'light');
  if (state.setup) state.setup(doc);
  if (state.hover) doc.querySelectorAll('*').forEach(el => el.classList.add(`${HARNESS}h`));
  if (state.focus) {
    doc.querySelectorAll('a, button, input, textarea, select, summary, [tabindex]').forEach(el => el.classList.add(`${HARNESS}fv`, `${HARNESS}f`));
    doc.querySelectorAll('*').forEach(el => el.classList.add(`${HARNESS}fw`));
  }
  const link = doc.querySelector('link[rel="stylesheet"]');
  const kill = doc.createElement('style');
  kill.textContent = KILL;
  doc.head.prepend(kill);
  const style = doc.createElement('style');
  style.textContent = transform(await cssText(link.href), link.href, state);
  link.replaceWith(style);
  await doc.fonts.ready;
  return kill;
}

function describe(el) {
  let s = el.tagName.toLowerCase();
  if (el.id) s += `#${el.id}`;
  const classes = [...el.classList].filter(c => !c.startsWith(HARNESS)).slice(0, 3);
  if (classes.length) s += `.${classes.join('.')}`;
  if (!el.id && !classes.length && el.parentElement && el.parentElement !== el.ownerDocument.documentElement) {
    s = `${describe(el.parentElement)} > ${s}`;
  }
  return s;
}

function elements(doc) {
  return [doc.documentElement, doc.body, ...doc.body.querySelectorAll('*')];
}

function serialize(cs) {
  return cs.cssText || Array.from(cs, p => `${p}: ${cs.getPropertyValue(p)}`).join('; ');
}

function parse(cs) {
  const map = new Map();
  for (let i = 0; i < cs.length; i += 1) {
    const p = cs[i];
    if (!p.startsWith('--')) map.set(p, cs.getPropertyValue(p));
  }
  return map;
}

let motionList = null;
function motionProps(cs) {
  if (!motionList) motionList = Array.from(cs).filter(p => MOTION.test(p));
  return motionList;
}

function pseudos(a, b) {
  const list = [''];
  for (const pseudo of ['::before', '::after']) {
    const ca = a.ownerDocument.defaultView.getComputedStyle(a, pseudo).content;
    const cb = b.ownerDocument.defaultView.getComputedStyle(b, pseudo).content;
    if (!['none', 'normal'].includes(ca) || !['none', 'normal'].includes(cb)) list.push(pseudo);
  }
  if (/^(LI|SUMMARY)$/.test(a.tagName)) list.push('::marker');
  if (/^(INPUT|TEXTAREA)$/.test(a.tagName)) list.push('::placeholder');
  return list;
}

function compare(docA, docB, motionOnly, record) {
  const as = elements(docA);
  const bs = elements(docB);
  if (as.length !== bs.length || as.some((el, i) => el.tagName !== bs[i].tagName)) {
    const i = as.findIndex((el, k) => !bs[k] || el.tagName !== bs[k].tagName);
    return `Struktur weicht ab bei Element ${i}: ${as[i] ? describe(as[i]) : '–'} / ${bs[i] ? describe(bs[i]) : '–'}`;
  }
  const winA = docA.defaultView;
  const winB = docB.defaultView;
  for (let i = 0; i < as.length; i += 1) {
    for (const pseudo of pseudos(as[i], bs[i])) {
      const ca = winA.getComputedStyle(as[i], pseudo || null);
      const cb = winB.getComputedStyle(bs[i], pseudo || null);
      if (motionOnly) {
        for (const prop of motionProps(ca)) {
          const va = ca.getPropertyValue(prop);
          const vb = cb.getPropertyValue(prop);
          if (va !== vb) record({ el: describe(bs[i]), pseudo, prop, a: va, b: vb });
        }
        continue;
      }
      if (serialize(ca) === serialize(cb)) continue;
      const ma = parse(ca);
      const mb = parse(cb);
      for (const [prop, va] of ma) {
        if (MOTION.test(prop)) continue;
        const vb = mb.get(prop);
        if (va !== vb) record({ el: describe(bs[i]), pseudo, prop, a: va, b: vb ?? '' });
      }
    }
  }
  return null;
}

async function run() {
  const host = document.getElementById('frames');
  const frameA = document.createElement('iframe');
  const frameB = document.createElement('iframe');
  for (const f of [frameA, frameB]) {
    f.setAttribute('sandbox', 'allow-same-origin');
    host.appendChild(f);
  }
  const diffs = [];
  const structure = [];
  let total = 0;
  let checked = 0;
  for (const page of PAGES) {
    for (const [w, h] of SIZES) {
      for (const f of [frameA, frameB]) { f.style.width = `${w}px`; f.style.height = `${h}px`; }
      const sized = STATE_SIZES.some(([sw]) => sw === w);
      for (const state of STATES) {
        if (!BASIC.has(state.name) && !sized) continue;
        const docA = await load(frameA, `../baseline/${page}`);
        const docB = await load(frameB, `../current/${page}`);
        const killA = await prepare(docA, state);
        const killB = await prepare(docB, state);
        const record = d => {
          total += 1;
          if (diffs.length < MAX_DIFFS) diffs.push({ page: page || '/', width: w, state: state.name, ...d });
        };
        const problem = compare(docA, docB, false, record);
        if (problem) {
          structure.push({ page: page || '/', width: w, state: state.name, problem });
        } else {
          killA.disabled = true;
          killB.disabled = true;
          compare(docA, docB, true, record);
        }
        checked += 1;
        await new Promise(r => setTimeout(r, 0));
      }
    }
  }
  document.getElementById('result').textContent = JSON.stringify({ checked, total, diffs, structure });
  document.documentElement.dataset.done = '1';
}

run().catch(err => {
  document.getElementById('result').textContent = JSON.stringify({ error: String(err && err.stack || err) });
});
