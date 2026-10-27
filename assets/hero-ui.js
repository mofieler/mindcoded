// @ts-check
/**
 * mindcoded.studio — Finale der Hero-Animation: dieselbe Oberfläche als Desktop, Tablet und Handy.
 *
 * Jedes Element (Rahmen, Statusleiste, Logo, Navigation, Überschrift, Text, Buttons, Kalender,
 * Karten) behält seine Punkte in allen drei Layouts: Punkt k eines Elements liegt jeweils an
 * derselben Stelle der Lesereihenfolge des Elements (beim Rahmen: des Umfangs). Dadurch sieht man,
 * wie das Fenster schmaler wird und Elemente als Ganzes wandern, schrumpfen und sich neu anordnen:
 *   Desktop → Tablet  Navigation klappt zum Menü-Button zusammen, Kalender rutscht unter den Text
 *                     und wird zur Wochenleiste
 *   Tablet  → Handy   Buttons stapeln sich, Karten werden zum Karussell mit Seitenpunkten,
 *                     der Anfrage-Button wandert in eine feste Leiste am unteren Rand
 *
 * Farbmarken wie in hero-canvas.js: Schwarz = Grundfarbe, Rot = Akzent (werden beim Zeichnen
 * durch die Farben aus den CSS-Tokens ersetzt).
 */

const INK = '#000';
const AC = '#ff0000';
export const DEVICES = ['desktop', 'tablet', 'phone'];

/** Reihenfolge der Umordnung (von oben nach unten) – je Stufe STAGGER Sekunden später. */
const ORDER = {
  frame: 0, chrome: 1, logo: 2, link0: 3, link1: 3.3, link2: 3.6, navCta: 4, eyebrow: 5, h1: 6, copy: 7,
  btnPrimary: 8, btnSecondary: 8.5, card: 9, f0: 10, f1: 10.5, f2: 11,
};
export const ELEMENTS = Object.keys(ORDER);
const STAGGER = 0.05;

const box = (x, y, w, h) => ({ x, y, w, h });

/** Position und Größe jedes Elements je Gerät – in Koordinaten der Motivfläche (0…w, 0…h). */
export function uiLayouts(w, h) {
  const desktop = (() => {
    // höchstens 16:10 – in der flachen Motivfläche auf dem Handy sonst unnatürlich breit
    const fh = h * .92, fw = Math.min(w * .94, fh * 1.6), fx = (w - fw) / 2, fy = h * .04, bar = fh * .08;
    const px = fx + fw * .05, top = fy + bar + fh * .05, cw = fw * .9, lr = fh * .022;
    const fs = fh * .1, hy = top + fh * .16, sy = hy + fs * 2.25, by = sy + fh * .075;
    const cy0 = fy + fh * .72, chh = fh * .2, cg = fw * .025, cw2 = (cw - cg * 2) / 3;
    const link = i => box(fx + fw * (.5 + i * .09), top + lr * .65, fw * .06, lr * .7);
    return {
      frame: box(fx, fy, fw, fh), chrome: box(fx, fy, fw, bar),
      logo: box(px, top, lr * 2.8 + fw * .08, lr * 2), link0: link(0), link1: link(1), link2: link(2),
      navCta: box(px + cw - fw * .12, top - lr * .3, fw * .12, lr * 2.6),
      eyebrow: box(px, top + fh * .09, fw * .17, fh * .04), h1: box(px, hy, fw * .42, fs * 2),
      copy: box(px, sy, fw * .33, fh * .048),
      btnPrimary: box(px, by, fw * .17, fh * .07), btnSecondary: box(px + fw * .19, by, fw * .13, fh * .07),
      card: box(fx + fw * .55, top + fh * .09, fw * .4, fh * .47),
      f0: box(px, cy0, cw2, chh), f1: box(px + cw2 + cg, cy0, cw2, chh), f2: box(px + (cw2 + cg) * 2, cy0, cw2, chh),
    };
  })();

  const tablet = (() => {
    const fh = h * .92, fw = Math.min(w * .94, fh * .74), fx = (w - fw) / 2, fy = h * .04;
    const pad = fw * .07, px = fx + pad, cw = fw - pad * 2, bar = fh * .045, lr = fh * .018;
    const nav = fy + bar + fh * .03, bw = fw * .07;
    const line = i => box(px + cw - bw, nav + lr * (.1 + i * .72), bw, lr * .36);
    const cg = fw * .03, cw3 = (cw - cg * 2) / 3, fy3 = nav + fh * .7;
    return {
      frame: box(fx, fy, fw, fh), chrome: box(fx, fy, fw, bar),
      logo: box(px, nav, lr * 2.8 + fw * .1, lr * 2), link0: line(0), link1: line(1), link2: line(2),
      navCta: box(px + cw - bw - fw * .04 - fw * .2, nav - lr * .3, fw * .2, lr * 2.6),
      eyebrow: box(px, nav + fh * .07, fw * .3, fh * .032), h1: box(px, nav + fh * .12, cw * .75, fh * .13),
      copy: box(px, nav + fh * .27, cw * .62, fh * .04),
      btnPrimary: box(px, nav + fh * .335, fw * .3, fh * .05), btnSecondary: box(px + fw * .33, nav + fh * .335, fw * .24, fh * .05),
      card: box(px, nav + fh * .415, cw, fh * .26),
      f0: box(px, fy3, cw3, fh * .14), f1: box(px + cw3 + cg, fy3, cw3, fh * .14), f2: box(px + (cw3 + cg) * 2, fy3, cw3, fh * .14),
    };
  })();

  const phone = (() => {
    const fh = h * .92, fw = Math.min(w * .94, fh * .49), fx = (w - fw) / 2, fy = h * .04;
    const pad = fw * .08, px = fx + pad, cw = fw - pad * 2, bar = fh * .05, lr = fh * .016;
    const nav = fy + bar + fh * .015, bw = fw * .1;
    const line = i => box(px + cw - bw, nav + lr * (.1 + i * .72), bw, lr * .36);
    const peekX = px + cw * .82 + fw * .035;
    return {
      frame: box(fx, fy, fw, fh), chrome: box(fx, fy, fw, bar),
      logo: box(px, nav, lr * 2.8 + fw * .14, lr * 2), link0: line(0), link1: line(1), link2: line(2),
      navCta: box(px, fy + fh * .89, cw, fh * .06),                       // feste Leiste unten
      eyebrow: box(px, fy + fh * .135, fw * .42, fh * .026), h1: box(px, fy + fh * .18, cw * .8, fh * .12),
      copy: box(px, fy + fh * .315, cw * .8, fh * .034),
      btnPrimary: box(px, fy + fh * .37, cw, fh * .045), btnSecondary: box(px, fy + fh * .425, cw, fh * .045),
      card: box(px, fy + fh * .495, cw, fh * .215),
      f0: box(px, fy + fh * .735, cw * .82, fh * .105),                   // Karussell: eine Karte …
      f1: box(peekX, fy + fh * .735, fx + fw * .97 - peekX, fh * .105),   // … die nächste lugt hervor
      f2: box(fx + fw / 2 - fw * .1, fy + fh * .853, fw * .2, fh * .016),  // Seitenpunkte
    };
  })();

  return { desktop, tablet, phone };
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  if (c.roundRect) c.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2)));
  else c.rect(x, y, w, h);
}

const pill = (c, r) => roundRect(c, r.x, r.y, r.w, r.h, Math.min(r.w, r.h) / 2);

function accentFill(c, fn) {
  c.fillStyle = AC;
  fn();
  c.fill();
  c.fillStyle = INK;
}

/** Zeichnet ein Element in sein Rechteck. lw: Linienstärken passend zur Motivgröße. */
function drawElement(c, key, r, device, lang, lw) {
  switch (key) {
    case 'frame': {
      const rad = device === 'desktop' ? 18 : device === 'tablet' ? Math.min(r.w, r.h) * .07 : r.w * .17;
      c.lineWidth = lw.frame;
      roundRect(c, r.x, r.y, r.w, r.h, rad);
      c.stroke();
      break;
    }
    case 'chrome': {
      if (device === 'desktop') {
        // Browserleiste: Trennlinie, drei Punkte, Adressfeld
        c.lineWidth = lw.frame;
        c.beginPath(); c.moveTo(r.x, r.y + r.h); c.lineTo(r.x + r.w, r.y + r.h); c.stroke();
        [0, 1, 2].forEach(i => { c.beginPath(); c.arc(r.x + r.h * .45 + i * r.h * .34, r.y + r.h / 2, r.h * .095, 0, 7); c.fill(); });
        c.lineWidth = lw.line;
        const uw = r.w * .34, uh = r.h * .46, ux = r.x + (r.w - uw) / 2, uy = r.y + (r.h - uh) / 2;
        roundRect(c, ux, uy, uw, uh, uh / 2); c.stroke();
        c.beginPath(); c.arc(ux + uh * .62, r.y + r.h / 2, uh * .16, 0, 7); c.fill();
        roundRect(c, ux + uh * 1.1, r.y + r.h / 2 - uh * .1, uw * .42, uh * .2, uh * .1); c.fill();
      } else {
        // Statusleiste: Uhrzeit links, Akku rechts, Kamera (Tablet) bzw. Notch (Handy) mittig
        const cy = r.y + r.h * .55, s = Math.max(2.5, r.h * .2);
        roundRect(c, r.x + r.w * .09, cy - s / 2, r.w * .12, s, s / 2); c.fill();
        c.lineWidth = Math.max(1.5, s * .32);
        roundRect(c, r.x + r.w * .79, cy - s * .6, r.w * .1, s * 1.2, s * .3); c.stroke();
        if (device === 'phone') {
          roundRect(c, r.x + r.w * .36, r.y + r.h * .16, r.w * .28, r.h * .48, r.h * .24); c.fill();
        } else {
          c.beginPath(); c.arc(r.x + r.w / 2, cy, s * .55, 0, 7); c.fill();
        }
      }
      break;
    }
    case 'logo': {
      const rad = r.h / 2;
      accentFill(c, () => { c.beginPath(); c.arc(r.x + rad, r.y + rad, rad, 0, 7); });
      roundRect(c, r.x + rad * 2.8, r.y + rad * .55, r.w - rad * 2.8, rad * .9, rad * .45); c.fill();
      break;
    }
    case 'link0': case 'link1': case 'link2':
      roundRect(c, r.x, r.y, r.w, r.h, r.h / 2); c.fill();
      break;
    case 'navCta':
      // Handy: feste Leiste unten – in Akzentfarbe, als Umriss (so viele Punkte wie der Nav-Button)
      c.lineWidth = lw.line;
      if (device === 'phone') c.strokeStyle = AC;
      pill(c, r);
      c.stroke();
      c.strokeStyle = INK;
      break;
    case 'eyebrow':
      c.lineWidth = lw.line; pill(c, r); c.stroke();
      accentFill(c, () => { c.beginPath(); c.arc(r.x + r.h / 2, r.y + r.h / 2, r.h * .175, 0, 7); });
      roundRect(c, r.x + r.h * .9, r.y + r.h * .4, r.w * .59, r.h * .225, r.h * .11); c.fill();
      break;
    case 'h1': {
      const l1 = lang === 'DE' ? 'Jetzt' : 'Book your';
      const l2 = lang === 'DE' ? 'buchen.' : 'session.';
      let fs = r.h / 2;
      c.font = `semi-condensed 800 ${fs * .82}px "Bricolage Grotesque"`;
      const mw = Math.max(c.measureText(l1).width, c.measureText(l2).width);
      if (mw > r.w) {
        fs *= r.w / mw;
        c.font = `semi-condensed 800 ${fs * .82}px "Bricolage Grotesque"`;
      }
      c.textBaseline = 'top';
      c.lineWidth = fs * .035;
      c.fillText(l1, r.x, r.y); c.strokeText(l1, r.x, r.y);
      c.fillText(l2, r.x, r.y + fs); c.strokeText(l2, r.x, r.y + fs);
      break;
    }
    case 'copy':
      roundRect(c, r.x, r.y, r.w, r.h * .34, r.h * .17); c.fill();
      roundRect(c, r.x, r.y + r.h * .66, r.w * .76, r.h * .34, r.h * .17); c.fill();
      break;
    case 'btnPrimary':
      accentFill(c, () => pill(c, r));
      break;
    case 'btnSecondary':
      c.lineWidth = lw.line; pill(c, r); c.stroke();
      break;
    case 'card':
      drawCalendar(c, r, lw);
      break;
    case 'f0': case 'f1': case 'f2':
      if (device === 'phone' && key === 'f2') drawPager(c, r);
      else drawFeature(c, r, key === 'f0', lw, device === 'phone' && key === 'f1');
      break;
    default:
      break;
  }
}

/** Kalender-Widget (Buchung): Kopf mit Pfeilen, Tagesraster mit gewähltem Tag, Zeitfenster, Button. */
function drawCalendar(c, r, lw) {
  const { x: ix, y: iy, w: iw, h: ih } = r;
  const ip = iw * .07;
  c.lineWidth = lw.frame;
  roundRect(c, ix, iy, iw, ih, Math.min(14, ih * .08)); c.stroke();
  c.lineWidth = lw.line;
  roundRect(c, ix + ip, iy + ih * .07, iw * .26, ih * .043, ih * .02); c.fill();
  [0, 1].forEach(i => {
    const ax = ix + iw - ip - (1 - i) * iw * .1, ay = iy + ih * .091, d = ih * .026, dir = i ? 1 : -1;
    c.beginPath(); c.moveTo(ax - d * .5 * dir, ay - d); c.lineTo(ax + d * .5 * dir, ay); c.lineTo(ax - d * .5 * dir, ay + d); c.stroke();
  });
  const cell = (iw - ip * 2) / 7;
  const day = (cx, cy, m, kind) => {
    if (kind === 2) accentFill(c, () => { c.beginPath(); c.arc(cx, cy, m * .42, 0, 7); });
    else if (kind === 1) { c.beginPath(); c.arc(cx, cy, m * .36, 0, 7); c.stroke(); }
    else { c.beginPath(); c.arc(cx, cy, m * .13, 0, 7); c.fill(); }
  };
  // Breites, flaches Format (Tablet, Handy): Wochenleiste statt Monatsraster – wie auf echten Seiten.
  const week = iw / ih > 1.4;
  if (week) {
    const m = Math.min(cell, ih * .26);
    for (let col = 0; col < 7; col++) {
      const cx = ix + ip + cell * (col + .5), cy = iy + ih * .37;
      roundRect(c, cx - m * .18, cy - m * .78, m * .36, m * .07, m * .035); c.fill();
      day(cx, cy, m, col === 4 ? 2 : col === 1 || col === 5 ? 1 : 0);
    }
  } else {
    const rh = ih * .085, gy0 = iy + ih * .2, m = Math.min(cell, rh);
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 7; col++) {
        if ((row === 0 && col < 2) || (row === 4 && col > 3)) continue;
        day(ix + ip + cell * (col + .5), gy0 + rh * (row + .5), m,
          row === 2 && col === 4 ? 2 : (row === 1 && col === 5) || (row === 3 && col === 1) ? 1 : 0);
      }
    }
  }
  const ty = iy + ih * (week ? .6 : .67), tg = iw * .03, tw = (iw - ip * 2 - tg * 2) / 3, th = ih * (week ? .12 : .1);
  [0, 1, 2].forEach(i => {
    const tx = ix + ip + i * (tw + tg);
    if (i === 1) accentFill(c, () => roundRect(c, tx, ty, tw, th, th / 2));
    else { roundRect(c, tx, ty, tw, th, th / 2); c.stroke(); }
  });
  roundRect(c, ix + ip, iy + ih * (week ? .79 : .82), iw - ip * 2, ih * (week ? .12 : .1), ih * .06); c.fill();
}

/** Leistungskarte: Symbol, Titel, Text, kleines Etikett. peek: nur der sichtbare Anschnitt im Karussell. */
function drawFeature(c, r, accent, lw, peek) {
  const chh = r.h, ir = chh * .14;
  c.lineWidth = lw.line;
  roundRect(c, r.x, r.y, r.w, r.h, Math.min(12, r.h * .12)); c.stroke();
  c.beginPath(); c.arc(r.x + chh * .1 + ir, r.y + chh * .12 + ir, ir, 0, 7);
  if (accent) accentFill(c, () => {}); else c.stroke();
  if (peek) return;
  roundRect(c, r.x + chh * .1, r.y + chh * .58, r.w * .48, chh * .09, chh * .045); c.fill();
  roundRect(c, r.x + chh * .1, r.y + chh * .755, r.w * .32, chh * .06, chh * .03); c.fill();
  roundRect(c, r.x + r.w - chh * .1 - r.w * .18, r.y + chh * .12 + ir * .6, r.w * .18, chh * .08, chh * .04); c.fill();
}

/** Seitenpunkte unter dem Karussell – der erste ist aktiv. */
function drawPager(c, r) {
  const rad = r.h / 2;
  [0, 1, 2].forEach(i => {
    const draw = () => { c.beginPath(); c.arc(r.x + r.w * (.2 + i * .3), r.y + rad, rad, 0, 7); };
    if (i === 0) accentFill(c, draw); else { draw(); c.fill(); }
  });
}

/**
 * Zeichnet ein Element in eine kleine Leinwand und liefert die eingefärbten Pixel
 * (Mitte in Motivkoordinaten, Farbklasse 0 = Grundfarbe, 1 = Akzent, 2 = hell).
 */
function rasterize(key, r, device, lang, lw, w, h) {
  const m = Math.ceil(lw.frame + 4);
  const x0 = Math.max(0, Math.floor(r.x - m)), y0 = Math.max(0, Math.floor(r.y - m));
  const x1 = Math.min(w, Math.ceil(r.x + r.w + m)), y1 = Math.min(h, Math.ceil(r.y + r.h + m));
  const cw = Math.max(1, x1 - x0), ch = Math.max(1, y1 - y0);
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const c = canvas.getContext('2d', { willReadFrequently: true });
  if (!c) throw new Error('Hero: Canvas 2D nicht verfügbar');
  c.fillStyle = c.strokeStyle = INK;
  c.lineCap = c.lineJoin = 'round';
  c.translate(-x0, -y0);
  drawElement(c, key, r, device, lang, lw);
  const data = c.getImageData(0, 0, cw, ch).data;
  const xs = [], ys = [], cls = [];
  for (let y = 0, k = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++, k += 4) {
      if (data[k + 3] <= 110) continue;
      const red = data[k], green = data[k + 1];
      xs.push(x0 + x + .5);
      ys.push(y0 + y + .5);
      cls.push(red > 140 && green < 90 ? 1 : green > 140 && red < 90 ? 2 : 0);
    }
  }
  return { xs: Float32Array.from(xs), ys: Float32Array.from(ys), cls: Uint8Array.from(cls), area: xs.length };
}

/**
 * Punkte auf einem versetzten Raster (Abstand g), gemeinsam für alle Elemente eines Layouts.
 * Jede Rasterzelle wertet alle Pixel in ihrem Bereich aus, nicht nur den Mittelpunkt: So fallen
 * dünne Linien nie zwischen zwei Rasterzeilen, und der Punkt sitzt im Schwerpunkt der Tinte –
 * Kanten bleiben gerade.
 */
function gridPoints(img, g) {
  const gy = g * .866;
  const cells = new Map();
  for (let k = 0; k < img.area; k++) {
    const x = img.xs[k], y = img.ys[k];
    const row = Math.floor(y / gy);
    const col = Math.floor((x - (row & 1) * g / 2) / g);
    const id = row * 4096 + col + 1;
    let cell = cells.get(id);
    if (!cell) cells.set(id, (cell = [0, 0, 0, 0, 0]));
    cell[0] += 1;
    cell[1] += x;
    cell[2] += y;
    if (img.cls[k]) cell[2 + img.cls[k]] += 1;
  }
  const min = Math.max(2, g * gy * .06);
  const pts = [];
  for (const [n, sx, sy, accent, soft] of cells.values()) {
    if (n >= min) pts.push([sx / n, sy / n, accent >= n * .3 ? 1 : soft >= n * .3 ? 2 : 0]);
  }
  return pts;
}

/** Rasterabstand, bei dem ein Layout rund N Punkte liefert (wie sampleShape() in shape-sample.js). */
function fitGrid(list, N) {
  const area = list.reduce((sum, img) => sum + img.area, 0) || 1;
  let g = Math.max(1.2, Math.sqrt(area / (N * .866)));
  let points = list.map(img => gridPoints(img, g));
  for (let it = 0; it < 4; it++) {
    const ratio = points.reduce((sum, pts) => sum + pts.length, 0) / N;
    if (!ratio || (ratio > .97 && ratio < 1.05)) break;
    g = Math.max(1.2, g * Math.sqrt(ratio));
    points = list.map(img => gridPoints(img, g));
  }
  return { g, points };
}

/**
 * Baut die drei Layouts als Punktziele für die Hero-Animation.
 * @param {{ R: {x:number,y:number,w:number,h:number}, N: number, lang?: string, random?: () => number }} opts
 *   R Motivfläche in Koordinaten des Hero, N Anzahl der Punkte, random austauschbar für Tests
 * @returns {{shapes: {p: Float32Array, c: Uint8Array}[], delay: Float32Array, tap: {x:number,y:number},
 *           rects: object, elementOf: Uint8Array, grids: number[]}}  shapes: Desktop, Tablet, Handy
 */
export function buildResponsiveUi({ R, N, lang = 'DE', random = Math.random }) {
  const w = Math.max(10, Math.round(R.w));
  const h = Math.max(10, Math.round(R.h));
  const layouts = uiLayouts(w, h);
  const lw = { line: Math.max(2, Math.min(3.5, w * .006)), frame: Math.max(2.4, Math.min(4, w * .0068)) };

  // Rasterabstand je Gerät so, dass jedes Layout rund N Punkte bietet: Auf dem kleineren Handy
  // rücken die Punkte enger zusammen, kleine Schrift bleibt lesbar.
  const images = DEVICES.map(device => ELEMENTS.map(key => rasterize(key, layouts[device][key], device, lang, lw, w, h)));
  const fitted = images.map(list => fitGrid(list, N));
  const grids = fitted.map(f => f.g);
  const points = fitted.map(f => f.points);

  // Punkte auf die Elemente verteilen (nach mittlerer Größe über alle drei Layouts) und zufällig
  // über alle Indizes mischen, damit der Übergang aus dem vorigen Motiv wie bei den anderen wirkt.
  const counts = ELEMENTS.map((_, e) => Math.round(points.reduce((sum, list) => sum + list[e].length, 0) / points.length));
  const total = counts.reduce((a, b) => a + b, 0);
  const alloc = total ? counts.map(n => Math.floor(N * n / total)) : counts.map((_, e) => (e ? 0 : N));
  let rest = N - alloc.reduce((a, b) => a + b, 0);
  for (let e = 0; rest > 0; e = (e + 1) % alloc.length) {
    if (counts[e] > 0) { alloc[e] += 1; rest -= 1; }
  }
  const elementOf = new Uint8Array(N);
  let fill = 0;
  alloc.forEach((n, e) => { for (let k = 0; k < n; k++) elementOf[fill++] = e; });
  for (let i = N - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const t = elementOf[i]; elementOf[i] = elementOf[j]; elementOf[j] = t;
  }

  const shapes = DEVICES.map(() => ({ p: new Float32Array(N * 2), c: new Uint8Array(N) }));
  const delay = new Float32Array(N);
  const members = ELEMENTS.map(() => /** @type {number[]} */ ([]));
  for (let i = 0; i < N; i++) members[elementOf[i]].push(i);

  // Punkt k eines Elements sitzt in jedem Layout an derselben Stelle der Reihenfolge (Zeile für
  // Zeile, beim Rahmen entlang des Umfangs). Jede Zielstelle wird gleichmäßig besetzt, und das
  // Element bewegt sich als Ganzes: Zeilen bleiben Zeilen, Ecken bleiben Ecken.
  ELEMENTS.forEach((key, e) => {
    const dots = members[e];
    if (!dots.length) return;
    dots.forEach(i => { delay[i] = ORDER[key] * STAGGER; });
    DEVICES.forEach((device, d) => {
      const r = layouts[device][key];
      const pts = ordered(points[d][e].length ? points[d][e] : [[r.x + r.w / 2, r.y + r.h / 2, 0]], r, key === 'frame');
      const M = pts.length, K = dots.length, seen = new Uint16Array(M);
      dots.forEach((i, k) => {
        const j = Math.min(M - 1, Math.floor(k * M / K));
        const q = pts[j];
        const jitter = seen[j]++ ? grids[d] * .5 : 0;
        shapes[d].p[i * 2] = q[0] + (random() - .5) * jitter + R.x;
        shapes[d].p[i * 2 + 1] = q[1] + (random() - .5) * jitter + R.y;
        shapes[d].c[i] = q[2];
      });
    });
  });

  const offset = r => box(r.x + R.x, r.y + R.y, r.w, r.h);
  const rects = Object.fromEntries(DEVICES.map(d => [d, Object.fromEntries(ELEMENTS.map(k => [k, offset(layouts[d][k])]))]));
  const btn = rects.phone.btnPrimary;
  return { shapes, delay, tap: { x: btn.x + btn.w / 2, y: btn.y + btn.h / 2 }, rects, elementOf, grids };
}

/** Sortiert Punkte in Lesereihenfolge oder – für Umrisse – nach dem Winkel um die Mitte des Rechtecks. */
function ordered(pts, r, around) {
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  const key = around
    ? q => Math.atan2((q[1] - cy) / r.h, (q[0] - cx) / r.w)
    : null;
  return pts.slice().sort(key ? (a, b) => key(a) - key(b) : (a, b) => a[1] - b[1] || a[0] - b[0]);
}
