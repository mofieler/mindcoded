// @ts-check
/**
 * mindcoded.studio — Formen in Punktziele verwandeln (für DotField und die Hero-Punktwolke).
 *
 * Eine Zeichenfunktion malt die Form schwarz auf eine unsichtbare Leinwand; Rot (#f00) markiert
 * Akzent-, Grün (#0f0) weiche Punkte. Ein versetztes Raster tastet die Tinte ab, sein Abstand wird
 * so lange angepasst, bis rund N Punkte herauskommen. Fehlen Punkte, werden Rasterpunkte leicht
 * versetzt doppelt belegt.
 */

/** @typedef {{ x: number, y: number, w: number, h: number }} Rect */
/** @typedef {(c: CanvasRenderingContext2D, w: number, h: number) => void} ShapeDraw */
/** Zielpositionen (x, y abwechselnd) und Farbstufe je Punkt: 0 Tinte, 1 Akzent, 2 weich.
 * @typedef {{ p: Float32Array, c: Uint8Array }} Sample */

/**
 * Pfad eines Rechtecks mit runden Ecken (ohne roundRect: eckig).
 * @param {CanvasRenderingContext2D} c
 * @param {number} x @param {number} y @param {number} w @param {number} h @param {number} r
 */
export function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  if (c.roundRect) c.roundRect(x, y, w, h, r);
  else c.rect(x, y, w, h);
}

/**
 * Tastet eine gezeichnete Form ab.
 * @param {ShapeDraw} draw
 * @param {Rect} R  Fläche, in der die Form liegt (Koordinaten des Ziels)
 * @param {number} N  Anzahl der Punkte
 * @param {boolean} [ordered]  true: Punkte der Reihe nach (Zeile für Zeile) statt zufällig verteilt
 * @returns {Sample}
 */
export function sampleShape(draw, R, N, ordered = false) {
  const w = Math.max(10, Math.round(R.w)), h = Math.max(10, Math.round(R.h));
  const oc = document.createElement('canvas');
  oc.width = w;
  oc.height = h;
  const c = oc.getContext('2d', { willReadFrequently: true });
  if (!c) throw new Error('sampleShape: Canvas 2D nicht verfügbar');
  c.fillStyle = c.strokeStyle = '#000';
  c.lineCap = c.lineJoin = 'round';
  draw(c, w, h);

  const d = c.getImageData(0, 0, w, h).data;
  let F = 0;
  for (let k = 3; k < d.length; k += 4) if (d[k] > 110) F++;

  /** @param {number} g @returns {[number, number, number][]} */
  const grid = g => {
    /** @type {[number, number, number][]} */
    const pts = [];
    const gy = g * 0.866;
    let row = 0;
    for (let y = gy / 2; y < h; y += gy, row++) {
      const off = (row % 2) * g / 2 + g / 4;
      for (let x = off; x < w; x += g) {
        const k = ((y | 0) * w + (x | 0)) * 4;
        if (d[k + 3] > 110) {
          const r = d[k], gg = d[k + 1];
          pts.push([x + R.x, y + R.y, r > 140 && gg < 90 ? 1 : gg > 140 && r < 90 ? 2 : 0]);
        }
      }
    }
    return pts;
  };

  let g = Math.max(1.3, Math.sqrt(F / N) * 1.05), pts = grid(g);
  for (let it = 0; it < 8 && pts.length; it++) {
    const ratio = pts.length / N;
    if (ratio > 0.99 && ratio < 1.03) break;
    g = Math.max(1.2, g * Math.sqrt(ratio));
    pts = grid(g);
  }

  if (!pts.length) pts.push([R.x + w / 2, R.y + h / 2, 0]);
  const M = pts.length;
  const idx = new Array(N);
  if (ordered) {
    for (let i = 0; i < N; i++) idx[i] = Math.min(M - 1, Math.floor(i * M / N));
  } else {
    const all = Array.from({ length: M }, (_, i) => i);
    shuffle(all);
    for (let i = 0; i < N; i++) idx[i] = i < M ? all[i] : all[Math.floor(Math.random() * M)];
    shuffle(idx);
  }

  const out = new Float32Array(N * 2), col = new Uint8Array(N), seen = new Uint8Array(M);
  for (let i = 0; i < N; i++) {
    const q = pts[idx[i]], dup = seen[idx[i]]++;
    out[i * 2] = q[0] + (dup ? (Math.random() - .5) * g * .5 : 0);
    out[i * 2 + 1] = q[1] + (dup ? (Math.random() - .5) * g * .5 : 0);
    col[i] = q[2];
  }
  return { p: out, c: col };
}

/** Fisher-Yates, an Ort und Stelle. @param {unknown[]} list */
function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = list[i];
    list[i] = list[j];
    list[j] = t;
  }
}
