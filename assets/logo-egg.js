// @ts-check
/**
 * Mindcoded Studio - Logo Easter Egg Interaction
 * Ein Klick aufs Logo lässt dessen Punkte kurz zu einem Icon werden: Das Icon erscheint
 * unterhalb des Logos, wächst dabei leicht und fliegt danach zurück ins Logo. Ohne Text.
 */

/** @typedef {(g: CanvasRenderingContext2D, s: number) => void} IconDraw */
/** @typedef {{ ink?: string, accent?: string }} EggColors */
/**
 * Punkt des Logos: Herkunft (ox, oy, Farbe a), Ziel im Icon (tx, ty, Farbe ta), Position,
 * Geschwindigkeit und Zufallswert für die Streuung.
 * @typedef {{ ox: number, oy: number, a: number, tx: number, ty: number, ta: number, x: number, y: number, vx: number, vy: number, u: number }} EggDot
 */

let busy = false, turn = 0;
/** @type {ReturnType<typeof setTimeout> | undefined} */
let safety;

/** @type {IconDraw[]} */
const shapes = [
  function bulb(g, s) { g.lineWidth = s * .07; g.beginPath(); g.arc(s / 2, s * .4, s * .26, Math.PI * .8, Math.PI * .2); g.lineTo(s * .6, s * .74); g.lineTo(s * .4, s * .74); g.closePath(); g.stroke(); g.fillRect(s * .4, s * .8, s * .2, s * .06); g.fillStyle = '#f00'; [[-.5, -.42], [0, -.5], [.5, -.42]].forEach(([dx, dy]) => { g.beginPath(); g.arc(s / 2 + dx * s * .78, s * .4 + dy * s * .5 - s * .06, s * .045, 0, 7); g.fill(); }); },
  function code(g, s) { g.lineWidth = s * .08; g.strokeStyle = '#f00'; g.beginPath(); g.moveTo(s * .3, s * .28); g.lineTo(s * .1, s * .5); g.lineTo(s * .3, s * .72); g.stroke(); g.beginPath(); g.moveTo(s * .7, s * .28); g.lineTo(s * .9, s * .5); g.lineTo(s * .7, s * .72); g.stroke(); g.strokeStyle = '#000'; g.beginPath(); g.moveTo(s * .58, s * .22); g.lineTo(s * .42, s * .78); g.stroke(); },
  function cursor(g, s) { g.beginPath(); const x = s * .34, y = s * .2; g.moveTo(x, y); g.lineTo(x, y + s * .5); g.lineTo(x + s * .12, y + s * .38); g.lineTo(x + s * .23, y + s * .6); g.lineTo(x + s * .32, y + s * .55); g.lineTo(x + s * .21, y + s * .34); g.lineTo(x + s * .38, y + s * .32); g.closePath(); g.fill(); g.strokeStyle = '#f00'; g.lineWidth = s * .05; [[-.1, -.06, -.2, -.14], [-.14, .1, -.26, .12], [.06, -.12, .1, -.24]].forEach(([a, b, c2, d2]) => { g.beginPath(); g.moveTo(x + a * s, y + b * s); g.lineTo(x + c2 * s, y + d2 * s); g.stroke(); }); },
  function rocket(g, s) { g.lineWidth = s * .06; g.beginPath(); g.moveTo(s / 2, s * .1); g.quadraticCurveTo(s * .72, s * .32, s * .64, s * .66); g.lineTo(s * .36, s * .66); g.quadraticCurveTo(s * .28, s * .32, s / 2, s * .1); g.closePath(); g.stroke(); g.beginPath(); g.arc(s / 2, s * .4, s * .07, 0, 7); g.fill(); g.beginPath(); g.moveTo(s * .36, s * .5); g.lineTo(s * .24, s * .7); g.lineTo(s * .37, s * .64); g.moveTo(s * .64, s * .5); g.lineTo(s * .76, s * .7); g.lineTo(s * .63, s * .64); g.stroke(); g.fillStyle = '#f00'; g.beginPath(); g.moveTo(s * .42, s * .72); g.quadraticCurveTo(s / 2, s * .98, s * .58, s * .72); g.closePath(); g.fill(); },
];

// Zeitplan in Sekunden
const GO = 0.22;       // Streuung beim Hinflug
const BACK_AT = 1.35;  // Rückflug beginnt
const END_AT = 2.5;    // spätestens fertig

/** @param {number} x */
const ease = x => { x = Math.max(0, Math.min(1, x)); return 1 - Math.pow(1 - x, 3); };

/**
 * 2D-Kontext oder Fehler – ohne Canvas gibt es kein Easter Egg (run() fängt das ab).
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2DSettings} [opts]
 */
function ctx2d(canvas, opts = {}) {
  const g = canvas.getContext('2d', opts);
  if (!g) throw new Error('Logo-Easter-Egg: Canvas 2D nicht verfügbar');
  return g;
}

/**
 * @param {HTMLElement | null} logo
 * @param {EggColors} [o]  Farben aus den CSS-Tokens (tokens.js)
 */
function run(logo, o = {}) {
  if (busy || !logo) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  busy = true;
  clearTimeout(safety);
  safety = setTimeout(() => { busy = false; document.querySelectorAll('[data-mc-egg]').forEach(n => n.remove()); logo.style.opacity = ''; }, 4000);
  try { play(logo, o); } catch (err) { busy = false; logo.style.opacity = ''; }
}

/**
 * @param {HTMLElement} logo
 * @param {EggColors} o
 */
function play(logo, o) {
  const ink = o.ink || '#000', acc = o.accent || '#f00', draw = shapes[turn++ % shapes.length];
  const r = logo.getBoundingClientRect(), W = innerWidth, H = innerHeight, dpr = Math.min(2, devicePixelRatio || 1);

  const cv = document.createElement('canvas');
  Object.assign(cv.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', zIndex: '85', pointerEvents: 'none' });
  cv.width = W * dpr; cv.height = H * dpr; cv.setAttribute('data-mc-egg', ''); cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv);
  const c = ctx2d(cv); c.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Punkte aus dem gerenderten Logo-Schriftzug gewinnen
  const S = 3, ow = Math.ceil(r.width * S) + 4, oh = Math.ceil(r.height * S) + 4;
  const oc = document.createElement('canvas'); oc.width = ow; oc.height = oh; const g = ctx2d(oc, { willReadFrequently: true });
  for (const k of logo.children) {
    const kr = k.getBoundingClientRect(), cs = getComputedStyle(k), text = k.textContent || '';
    g.font = `${cs.fontWeight} ${parseFloat(cs.fontSize) * S}px ${cs.fontFamily}`; g.fillStyle = text.startsWith('.') ? '#f00' : '#000';
    g.fillText(text, (kr.left - r.left) * S, (kr.bottom - r.top) * S - parseFloat(cs.fontSize) * S * .24);
  }
  let d = g.getImageData(0, 0, ow, oh).data;
  /** @type {EggDot[]} */
  const P = [];
  for (let y = 0; y < oh; y += 2) for (let x = 0; x < ow; x += 2) {
    const i = (y * ow + x) * 4;
    if (d[i + 3] > 120) P.push({ ox: r.left + x / S, oy: r.top + y / S, a: d[i] > 140 ? 1 : 0, tx: 0, ty: 0, ta: 0, x: 0, y: 0, vx: 0, vy: 0, u: 0 });
  }
  if (!P.length) { cv.remove(); busy = false; return; }

  // Icon unterhalb des Logos, horizontal am Schriftzug-Anfang ausgerichtet
  const B = Math.max(64, r.height * 2.8);
  const bx = r.left + Math.min(r.width, 160) / 2 - B / 2 + 4;
  const by = r.bottom + 18;
  const cx = bx + B / 2, cy = by + B / 2;
  const sc = document.createElement('canvas'), SS = Math.round(B * 2); sc.width = sc.height = SS;
  const sg = ctx2d(sc, { willReadFrequently: true }); sg.lineCap = sg.lineJoin = 'round'; sg.fillStyle = sg.strokeStyle = '#000'; draw(sg, SS);
  d = sg.getImageData(0, 0, SS, SS).data;
  /** @type {[number, number, number][]} */
  const T = [];
  for (let y = 0; y < SS; y += 2) for (let x = 0; x < SS; x += 2) { const i = (y * SS + x) * 4; if (d[i + 3] > 120) T.push([bx + x / 2, by + y / 2, d[i] > 140 ? 1 : 0]); }
  for (let i = T.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [T[i], T[j]] = [T[j], T[i]]; }
  P.forEach((p, i) => { const t = T[i % T.length]; p.tx = t[0] + (i >= T.length ? (Math.random() - .5) : 0); p.ty = t[1]; p.ta = t[2]; p.x = p.ox; p.y = p.oy; p.vx = p.vy = 0; p.u = Math.random(); });

  logo.style.transition = 'opacity 120ms'; logo.style.opacity = '0';
  const t0 = performance.now(); let last = t0;
  /** @param {number} now */
  const tick = now => {
    const dt = Math.min(.04, (now - last) / 1000), f = dt * 60, t = (now - t0) / 1000; last = now;
    // Leichtes Wachsen während das Icon steht: 0,88 → 1,15
    const grow = 0.88 + 0.27 * ease((t - GO) / 0.8);
    let home = 0;
    c.clearRect(0, 0, W, H);
    for (const p of P) {
      const back = t > BACK_AT + p.u * GO;
      const go = !back && t > p.u * GO;
      const tx = back || !go ? p.ox : cx + (p.tx - cx) * grow;
      const ty = back || !go ? p.oy : cy + (p.ty - cy) * grow;
      p.vx = (p.vx + (tx - p.x) * .09 * f) * Math.pow(.78, f); p.vy = (p.vy + (ty - p.y) * .09 * f) * Math.pow(.78, f);
      p.x += p.vx * f; p.y += p.vy * f;
      if (back && Math.abs(p.x - p.ox) < .5 && Math.abs(p.y - p.oy) < .5) home++;
      c.fillStyle = (go ? p.ta : p.a) ? acc : ink;
      c.globalAlpha = .95;
      const z = go ? 1.6 * Math.min(grow, 1.1) : 1.6;
      c.fillRect(p.x - z / 2, p.y - z / 2, z, z);
    }
    if (t > BACK_AT && (home > P.length * .97 || t > END_AT)) {
      logo.style.transition = 'opacity 200ms'; logo.style.opacity = '1'; cv.style.transition = 'opacity 200ms'; cv.style.opacity = '0';
      setTimeout(() => { cv.remove(); logo.style.opacity = ''; logo.style.transition = ''; busy = false; }, 260);
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export const MCEgg = { run };
export default MCEgg;
