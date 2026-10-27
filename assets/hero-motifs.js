// @ts-check
/**
 * mindcoded.studio — Motive der Hero-Punktwolke als reine Zeichenfunktionen (ShapeDraw, siehe
 * shape-sample.js): Wortmarke fürs Intro, Kopf mit Gehirn, Klammern und Code-Zeilen. Schwarz =
 * Tinte, Rot (AC) = Akzent, Grün = weiche Punkte. Die Oberfläche des Finales: hero-ui.js.
 */

import { roundRect } from './shape-sample.js';

/** @typedef {import('./shape-sample.js').ShapeDraw} ShapeDraw */

const AC = '#ff0000';

export const wordmarkC = (ink, acc, solid) => (c, w, h) => {
  c.fillStyle = c.strokeStyle = ink;
  c.font = '600 100px Manrope';
  const m1 = c.measureText('mindcoded').width;
  c.font = '86px "Space Mono"';
  const m2 = c.measureText('.studio').width;
  const s = Math.min(h * 0.62, (w * 0.94) / ((m1 + m2 + 4) / 100));
  let x = (w - (m1 + m2 + 4) * s / 100) / 2;
  const y = h * 0.5 + s * 0.36;
  c.textBaseline = 'alphabetic';
  c.lineWidth = s * 0.018;
  c.font = `600 ${s}px Manrope`;
  c.fillText('mindcoded', x, y);
  if (!solid) c.strokeText('mindcoded', x, y);
  x += (m1 + 4) * s / 100;
  c.fillStyle = c.strokeStyle = acc;
  c.font = `${s * 0.86}px "Space Mono"`;
  c.fillText('.studio', x, y);
  if (!solid) c.strokeText('.studio', x, y);
};

export const wordmark = wordmarkC('#000', AC);

export const monoWordC = (word, cursor, ink, acc, solid) => (c, w, h) => {
  c.fillStyle = c.strokeStyle = ink;
  c.font = '600 100px Manrope';
  const m = c.measureText(word + (cursor ? '_' : '')).width;
  const s = Math.min(h * 0.8, (w * 0.86) / (m / 100));
  c.font = `600 ${s}px Manrope`;
  c.textBaseline = 'alphabetic';
  c.lineWidth = s * 0.018;
  const x = (w - m * s / 100) / 2, y = h * 0.5 + s * 0.34;
  c.fillText(word, x, y);
  if (!solid) c.strokeText(word, x, y);
  if (cursor) {
    c.fillStyle = acc;
    c.fillRect(x + c.measureText(word).width + s * 0.06, y - s * 0.08, s * 0.45, s * 0.1);
  }
};

export const monoWord = (word, cursor) => monoWordC(word, cursor, '#000', AC);

const headGeo = (w, h) => {
  const s = Math.min(w, h) * 0.98, ox = (w - s) / 2 - s * 0.035, oy = (h - s) / 2;
  return { s, X: v => ox + v * s / 100, Y: v => oy + v * s / 100 };
};

const curve = (c, X, Y, p) => {
  c.beginPath();
  c.moveTo(X(p[0]), Y(p[1]));
  for (let i = 2; i + 5 < p.length; i += 6) {
    c.bezierCurveTo(X(p[i]), Y(p[i+1]), X(p[i+2]), Y(p[i+3]), X(p[i+4]), Y(p[i+5]));
  }
};

export const headOutline = (c, w, h) => {
  const { s, X, Y } = headGeo(w, h);
  c.lineWidth = Math.max(3.5, s * 0.013);
  curve(c, X, Y, [31,100, 31,94, 31,88, 31.5,84, 31.5,82, 30,80, 27,79.5, 23.5,79, 21,77, 21,74, 21,72.5, 22,71.2, 21.6,70, 20.4,69, 20.2,68, 21,67, 20.2,66, 19.8,65, 20.6,64, 18.6,63.2, 15.8,62, 15.6,59.8]);
  c.lineTo(X(22.5), Y(47.5));
  const p2 = [22.5,47.5, 23.5,45.5, 23,43, 22,40, 21,36, 21,30, 24,24, 30,10, 48,4, 62,5, 82,7, 92,24, 91,42, 90,54, 85,62, 80,68, 76,73, 73,80, 73,86, 73,92, 74,96, 75,100];
  for (let i = 2; i + 5 < p2.length; i += 6) {
    c.bezierCurveTo(X(p2[i]), Y(p2[i+1]), X(p2[i+2]), Y(p2[i+3]), X(p2[i+4]), Y(p2[i+5]));
  }
  c.stroke();
};

export const head = (c, w, h) => {
  headOutline(c, w, h);
  const { s, X, Y } = headGeo(w, h);
  c.strokeStyle = '#00ff00';
  c.lineWidth = Math.max(3.2, s * 0.012);
  curve(c, X, Y, [36,44, 31,40, 31,30, 37,26, 38,19, 46,14, 53,16, 58,11, 68,12, 72,17, 79,16, 85,23, 84,30, 89,35, 88,44, 82,47, 82,52, 77,55, 72,53, 68,58, 60,58, 57,54, 52,56, 46,55, 45,51, 40,52, 36,49, 36,44]);
  c.closePath();
  c.stroke();
  curve(c, X, Y, [72,53, 76,57, 75,61, 70,62, 66,62.5, 63,60, 63,57]);
  c.stroke();
  curve(c, X, Y, [60,57.5, 61,61, 61,64, 60,69]);
  c.stroke();
  c.lineWidth = Math.max(2.8, s * 0.01);
  [[40,40, 44,36, 41,32, 46,29],[47,24, 51,26, 55,22, 60,24],[63,18, 63,23, 68,24, 70,21],[74,24, 72,28, 77,31, 80,29],[50,34, 55,31, 58,36, 63,33],[66,32, 70,36, 74,34, 78,38],[46,45, 52,40, 58,44, 64,41],[68,44, 72,46, 76,43, 80,45],[52,50, 55,52, 59,51, 62,48],[65,57.5, 67.5,59, 70.5,58.5, 73,57]]
    .forEach(p => { curve(c, X, Y, p); c.stroke(); });
};

export const brackets = (c, w, h) => {
  const gh = Math.min(h * 0.6, w * 0.36), cx = w / 2, cy = h / 2, lw = gh * 0.12;
  c.lineWidth = lw;
  c.strokeStyle = AC;
  c.beginPath(); c.moveTo(cx - gh * 0.52, cy - gh * 0.42); c.lineTo(cx - gh * 1.08, cy); c.lineTo(cx - gh * 0.52, cy + gh * 0.42); c.stroke();
  c.beginPath(); c.moveTo(cx + gh * 0.52, cy - gh * 0.42); c.lineTo(cx + gh * 1.08, cy); c.lineTo(cx + gh * 0.52, cy + gh * 0.42); c.stroke();
  c.strokeStyle = '#000';
  c.beginPath(); c.moveTo(cx + gh * 0.2, cy - gh * 0.55); c.lineTo(cx - gh * 0.2, cy + gh * 0.55); c.stroke();
};

export const code = (c, w, h) => {
  /** @type {[number, number[], number][]} Einrückung, Segmentbreiten, erstes Segment hervorgehoben */
  const L = [[0,[.1,.24],0],[1,[.16,.3],1],[2,[.12,.08,.2],0],[2,[.28],1],[1,[.06],0],[1,[.18,.14],1],[2,[.1,.26],0],[3,[.2,.1],1],[3,[.3],0],[2,[.08],0],[1,[.06],0],[0,[.12],1]];
  const lh = (h * 0.86) / L.length, x0 = w * 0.12, iu = w * 0.065, bh = lh * 0.44;
  c.font = `500 ${lh * 0.46}px "Space Mono"`;
  c.textBaseline = 'middle';
  c.textAlign = 'right';
  L.forEach(([ind, segs, k], i) => {
    const y = h * 0.07 + i * lh;
    let x = x0 + ind * iu;
    c.fillStyle = '#000';
    c.fillText(String(i + 1).padStart(2, '0'), w * 0.08, y + bh / 2);
    segs.forEach((sw, j) => {
      c.fillStyle = k && j === 0 ? AC : '#000';
      roundRect(c, x, y, w * sw, bh, bh / 2);
      c.fill();
      x += w * sw + w * 0.022;
    });
  });
};
