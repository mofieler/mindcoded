// Einheitentests für die Formularlogik – laufen im echten Browser (Edge headless),
// ausgeführt von tests/test_browser.py. Ergebnis landet als JSON in #result.
import { validateContact, mapServerErrors, topicFromSearch, hasUnsentInput, isInternalNavigation, mailtoFallback } from '../assets/contact-form.js';
import { nextHeaderState } from '../assets/header.js';
import { formatCount, parseCount } from '../assets/count.js';
import { defaultTheme, themeToStore } from '../assets/theme.js';
import { isSlow, createFrameMonitor, quality, onQualityChange } from '../assets/perf.js';
import { easeOutExpo, lerpFactor, glideDuration, wheelDelta, nestedScroller } from '../assets/smooth-scroll.js';
import { DEVICES, ELEMENTS, uiLayouts, buildResponsiveUi } from '../assets/hero-ui.js';

const limits = { nameMax: 100, emailMax: 254, messageMin: 10, messageMax: 5000 };
const valid = { name: 'Max Mustermann', email: 'max.mustermann@example.com', message: 'Synthetische Testnachricht.' };
const results = [];

const eq = (actual, expected) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${JSON.stringify(actual)} ≠ ${JSON.stringify(expected)}`);
  }
};
const test = (name, fn) => {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (err) {
    results.push({ name, ok: false, error: err.message });
  }
};

test('leeres Formular meldet alle Pflichtfelder', () => eq(validateContact({}, limits), { name: 'required', email: 'required', message: 'required' }));
test('gültige Eingaben ohne Fehler', () => eq(validateContact(valid, limits), {}));
test('nur Leerzeichen gelten als leer', () => eq(validateContact({ ...valid, name: '   ' }, limits), { name: 'required' }));
test('E-Mail ohne Domain', () => eq(validateContact({ ...valid, email: 'max.mustermann@' }, limits), { email: 'email' }));
test('E-Mail mit Leerzeichen', () => eq(validateContact({ ...valid, email: 'max mustermann@example.com' }, limits), { email: 'email' }));
test('Nachricht zu kurz', () => eq(validateContact({ ...valid, message: 'kurz' }, limits), { message: 'messageTooShort' }));
test('Nachricht zu lang', () => eq(validateContact({ ...valid, message: 'x'.repeat(5001) }, limits), { message: 'messageTooLong' }));
test('Name zu lang', () => eq(validateContact({ ...valid, name: 'N'.repeat(101) }, limits), { name: 'nameTooLong' }));
test('Einwilligung nur wenn verlangt', () => {
  eq(validateContact({ ...valid, consent: false }, limits, false), {});
  eq(validateContact({ ...valid, consent: false }, limits, true), { consent: 'consent' });
});
test('Server-Fehlercodes werden übersetzt', () => eq(
  mapServerErrors({ name: 'required', email: 'invalid', message: 'too_short', topics: 'invalid' }),
  { name: 'required', email: 'email', message: 'messageTooShort' },
));

test('Thema aus der Adresse nur, wenn erlaubt', () => {
  const allowed = ['website', 'webapp'];
  eq(topicFromSearch('?thema=website', allowed), 'website');
  eq(topicFromSearch('?topic=webapp', allowed), 'webapp');
  eq(topicFromSearch('?thema=<script>', allowed), null);
  eq(topicFromSearch('', allowed), null);
});

test('Hochzählen: Endwerte werden erkannt', () => {
  eq(parseCount('61,5 %'), { num: '61,5', unit: ' %', value: 61.5, decimals: 1, comma: true });
  eq(parseCount('84.6%'), { num: '84.6', unit: '%', value: 84.6, decimals: 1, comma: false });
  eq(parseCount(' 12 '), { num: '12', unit: '', value: 12, decimals: 0, comma: false });
});
test('Hochzählen: Spannen und Text zählen nicht', () => {
  eq(parseCount('200–400'), null);
  eq(parseCount('1–3'), null);
  eq(parseCount('2,2 / 3'), null);
});
test('Hochzählen: Zwischenstände in der Schreibweise des Endwerts', () => {
  eq(formatCount(parseCount('61,5 %'), 30.25), '30,3 %');
  eq(formatCount(parseCount('84.6%'), 0), '0.0%');
  eq(formatCount(parseCount('12'), 7.6), '8');
});
test('Header: oben nie fixiert', () => {
  eq(nextHeaderState({ floating: true, shown: true, lastY: 400 }, 50, 100), { floating: false, shown: false, lastY: 50 });
});
test('Header: beim Herunterscrollen verborgen, beim Hochscrollen sichtbar', () => {
  let s = { floating: false, shown: false, lastY: 0 };
  s = nextHeaderState(s, 300, 100);
  eq([s.floating, s.shown], [true, false]);
  s = nextHeaderState(s, 600, 100);
  eq(s.shown, false);
  s = nextHeaderState(s, 560, 100);
  eq(s.shown, true);
  s = nextHeaderState(s, 563, 100); // kleine Bewegung ändert nichts
  eq(s.shown, true);
  s = nextHeaderState(s, 700, 100);
  eq(s.shown, false);
});

test('Formular: Warnung nur bei echten Eingaben', () => {
  eq(hasUnsentInput({ name: '', email: ' ', message: '' }), false);
  eq(hasUnsentInput({ name: '', email: '', message: 'Hallo' }), true);
});
test('Formular: keine Warnung bei Links innerhalb der Website', () => {
  const loc = new URL('https://example.com/?thema=website#kontakt');
  const link = href => ({ href, target: '', hasAttribute: () => false });
  eq(isInternalNavigation(link('https://example.com/datenschutz/'), loc), true);
  eq(isInternalNavigation(link('https://example.com/?thema=website#leistungen'), loc), false); // gleiche Seite
  eq(isInternalNavigation(link('https://example.org/'), loc), false);
  eq(isInternalNavigation({ href: 'https://example.com/x/', target: '_blank', hasAttribute: () => false }, loc), false);
  eq(isInternalNavigation(null, loc), false);
});

test('Formular: Notausgang per E-Mail-Programm mit Betreff, Text und Name', () => {
  const url = mailtoFallback('postfach@example.com', 'Anfrage über Beispiel', { name: 'Max Mustermann', message: 'Hallo & Grüße?' });
  eq(url.startsWith('mailto:postfach@example.com?subject=Anfrage%20%C3%BCber%20Beispiel&body='), true);
  eq(decodeURIComponent(url.split('&body=')[1]), 'Hallo & Grüße?\n\n– Max Mustermann');
});
test('Formular: Notausgang kürzt lange Nachrichten und lehnt ungültige Adressen ab', () => {
  const url = mailtoFallback('postfach@example.com', 'x', { name: '', message: 'a'.repeat(5000) }, 100);
  eq(decodeURIComponent(url.split('&body=')[1]).length, 100);
  eq(mailtoFallback('kein-postfach', 'x', { message: 'y' }), null);
  eq(mailtoFallback('a@example.com?cc=b@example.com', 'x', { message: 'y' }), null);
});

test('Farbschema: Voreinstellung folgt dem System oder dem festen Wert', () => {
  eq(defaultTheme('system', true), 'dark');
  eq(defaultTheme('system', false), 'light');
  eq(defaultTheme('dark', false), 'dark');
});
test('Farbschema: Rückkehr zur Voreinstellung wird nicht gespeichert', () => {
  eq(themeToStore('dark', 'light'), 'dark');
  eq(themeToStore('light', 'light'), null);
});

test('Leistung: Messfenster nach Median bewertet', () => {
  eq(isSlow(Array(60).fill(16.7)), false);
  eq(isSlow([...Array(40).fill(40), ...Array(20).fill(10)]), true);
  eq(isSlow([...Array(20).fill(40), ...Array(40).fill(16)]), false); // einzelne Ruckler zählen nicht
  eq(isSlow(Array(10).fill(80)), false); // zu wenige Werte
});
test('Leistung: dauerhaft langsame Bilder senken die Qualität einmal je Fenster', () => {
  const changes = [];
  const off = onQualityChange(q => changes.push(q.level));
  const monitor = createFrameMonitor();
  for (let i = 0; i < 400; i += 1) monitor.sample(16);
  eq(changes, []);
  for (let i = 0; i < 30 + 90; i += 1) monitor.sample(45);
  eq(changes, [1]);
  for (let i = 0; i < 30; i += 1) monitor.sample(400); // Pausen werden nicht gewertet
  eq(changes, [1]);
  eq(quality().density < 1, true);
  off();
});

test('Sanftes Scrollen: gleich weich bei 60 und 120 Hz', () => {
  const after = (hz, frames) => { let rest = 1; for (let i = 0; i < frames; i += 1) rest *= 1 - lerpFactor(1 / hz); return rest; };
  eq(Math.abs(after(60, 30) - after(120, 60)) < 1e-9, true);
  eq(lerpFactor(0), 0);
  eq(easeOutExpo(0), 0);
  eq(easeOutExpo(1), 1);
  eq(easeOutExpo(0.5) > 0.9, true); // schneller Start, weiches Ankommen
});
test('Sanftes Scrollen: Sprungdauer begrenzt, Raddrehung in Pixeln', () => {
  eq(glideDuration(0), 0.6);
  eq(glideDuration(-100000), 1.4);
  eq(wheelDelta({ deltaY: 3, deltaMode: 1 }, 800), 120);
  eq(wheelDelta({ deltaY: 1, deltaMode: 2 }, 800), 800);
  eq(wheelDelta({ deltaY: -53, deltaMode: 0 }, 800), -53);
});
test('Sanftes Scrollen: eigene Scrollbereiche behalten das Rad', () => {
  const box = document.createElement('div');
  box.style.cssText = 'height:50px;overflow:auto';
  const tall = document.createElement('div');
  tall.style.height = '200px';  // per CSSOM – die CSP sperrt style-Attribute im HTML
  const inner = document.createElement('span');
  tall.append(inner);
  box.append(tall);
  document.body.append(box);
  eq(nestedScroller(inner, 10) === box, true);  // kann nach unten scrollen
  eq(nestedScroller(inner, -10), null);         // steht oben – Seite scrollt weiter
  box.setAttribute('data-native-scroll', '');
  eq(nestedScroller(inner, -10) === box, true);
  box.remove();
});

test('Hero-Finale: Tablet schmaler als Desktop, Handy schmaler als Tablet, alles im Rahmen', () => {
  for (const [w, h] of [[672, 706], [440, 200]]) {
    const L = uiLayouts(w, h);
    eq(L.desktop.frame.w > L.tablet.frame.w && L.tablet.frame.w > L.phone.frame.w, true);
    for (const device of DEVICES) {
      const f = L[device].frame;
      for (const key of ELEMENTS) {
        const r = L[device][key];
        const inside = r.x >= f.x - 0.5 && r.y >= f.y - 0.5 && r.x + r.w <= f.x + f.w + 0.5 && r.y + r.h <= f.y + f.h + 0.5;
        if (!inside) throw new Error(`${device}/${key} ragt aus dem Rahmen (${w}×${h})`);
      }
    }
  }
});
test('Hero-Finale: jeder Punkt hat in allen drei Layouts ein Ziel in der Motivfläche', () => {
  const R = { x: 100, y: 50, w: 400, h: 420 };
  const N = 1500;
  let seed = 7;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const ui = buildResponsiveUi({ R, N, random });
  eq(ui.shapes.length, 3);
  eq(ui.delay.length, N);
  for (const shape of ui.shapes) {
    for (let i = 0; i < N; i += 1) {
      const x = shape.p[i * 2], y = shape.p[i * 2 + 1];
      if (!(x >= R.x - 4 && x <= R.x + R.w + 4 && y >= R.y - 4 && y <= R.y + R.h + 4)) throw new Error(`Punkt ${i} außerhalb: ${x}, ${y}`);
    }
  }
  eq(Math.max(...ui.delay) <= 0.6, true);
  // Dünne Linien fallen nie zwischen zwei Rasterzeilen: Unterkante des Rahmens in jedem Layout
  // (672×706 und 380×600 verloren sie früher bei Desktop bzw. Tablet).
  for (const [w, h] of [[672, 706], [380, 600], [R.w, R.h]]) {
    const res = w === R.w ? ui : buildResponsiveUi({ R: { x: 0, y: 0, w, h }, N: 2400, random });
    DEVICES.forEach((device, d) => {
      const f = res.rects[device].frame;
      const p = res.shapes[d].p;
      let bottom = 0;
      for (let i = 0; i < p.length / 2; i += 1) {
        if (Math.abs(p[i * 2 + 1] - (f.y + f.h)) < 3 && p[i * 2] > f.x + f.w * .2 && p[i * 2] < f.x + f.w * .8) bottom += 1;
      }
      if (bottom < 10) throw new Error(`${device} ${w}×${h}: Unterkante mit nur ${bottom} Punkten`);
    });
  }
  const tap = ui.rects.phone.btnPrimary;
  eq(ui.tap.x > tap.x && ui.tap.x < tap.x + tap.w && ui.tap.y > tap.y && ui.tap.y < tap.y + tap.h, true);
});

const failed = results.filter(r => !r.ok);
document.getElementById('result').textContent = JSON.stringify({ passed: results.length - failed.length, failed: failed.length, failures: failed });
document.documentElement.dataset.done = '1';
