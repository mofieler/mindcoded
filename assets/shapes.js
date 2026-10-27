// @ts-check
/**
 * Mindcoded Studio - Vector drawing functions for canvas dot field
 * Generates coordinate samples for Services, Stories, Projects, and Contact animations.
 */

import { roundRect } from './shape-sample.js';

const AC = '#ff0000', LT = '#00ff00', INK = '#000';
const rr = roundRect;
const box = (w, h, pad) => { const s = Math.min(w, h) * (pad || 1), ox = (w - s) / 2, oy = (h - s) / 2; return { s, X: v => ox + v * s / 100, Y: v => oy + v * s / 100, U: v => v * s / 100 }; };
// Linienstärke relativ zur Zeichenfläche – dick genug, damit das Punkteraster die Linie sicher trifft.
const LWf = (w, h) => Math.max(3, Math.min(w, h) * 0.014);
const arrowHead = (c, x, y, ang, len) => { c.beginPath(); c.moveTo(x - Math.cos(ang - .5) * len, y - Math.sin(ang - .5) * len); c.lineTo(x, y); c.lineTo(x - Math.cos(ang + .5) * len, y - Math.sin(ang + .5) * len); c.stroke(); };

const services = [
    (c, w, h) => {
      const { X, Y, U } = box(w, h, 0.96); c.lineWidth = LWf(w, h);
      const scr = [8, 38, 68];
      scr.forEach((sx, i) => {
        rr(c, X(sx), Y(32), U(24), U(46), U(3)); c.stroke();
        rr(c, X(sx + 3), Y(35.5), U(9), U(2.2), U(1)); c.fill();
        if (i === 0) { c.fillStyle = LT; rr(c, X(sx + 3), Y(41), U(18), U(12), U(1.5)); c.fill(); c.fillStyle = INK; [57, 61].forEach((y, k) => { rr(c, X(sx + 3), Y(y), U(k ? 10 : 15), U(2), U(1)); c.fill(); }); c.fillStyle = AC; rr(c, X(sx + 3), Y(68), U(9), U(4.5), U(2.2)); c.fill(); c.fillStyle = INK; }
        if (i === 1) { [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([a, b]) => { rr(c, X(sx + 3 + a * 9.5), Y(41 + b * 13), U(8.5), U(11), U(1.5)); c.stroke(); }); [69, 73].forEach((y, k) => { rr(c, X(sx + 3), Y(y), U(k ? 9 : 16), U(2), U(1)); c.fill(); }); }
        if (i === 2) { [41, 49, 57].forEach(y => { c.beginPath(); c.arc(X(sx + 5.5), Y(y + 2.5), U(2.4), 0, 7); c.stroke(); rr(c, X(sx + 10), Y(y + 1.5), U(10), U(2), U(1)); c.fill(); }); c.fillStyle = AC; rr(c, X(sx + 3), Y(68), U(18), U(5), U(2.5)); c.fill(); c.fillStyle = INK; }
      });
      c.strokeStyle = AC; c.lineWidth = LWf(w, h) * 1.1;
      [[20, 50], [50, 80]].forEach(([a, b]) => { c.beginPath(); c.moveTo(X(a), Y(28)); c.bezierCurveTo(X(a + 6), Y(15), X(b - 6), Y(15), X(b), Y(28)); c.stroke(); arrowHead(c, X(b), Y(28), 1.2, U(3)); });
      c.fillStyle = AC; c.beginPath(); const cx = X(76), cy = Y(62);
      c.moveTo(cx, cy); c.lineTo(cx, cy + U(11)); c.lineTo(cx + U(3), cy + U(8)); c.lineTo(cx + U(5.5), cy + U(13)); c.lineTo(cx + U(7.5), cy + U(12)); c.lineTo(cx + U(5), cy + U(7.5)); c.lineTo(cx + U(9), cy + U(7)); c.closePath(); c.fill();
      c.fillStyle = INK; c.strokeStyle = INK;
    },
    (c, w, h) => {
      const { X, Y, U } = box(w, h, 0.96);
      c.font = `700 ${U(66)}px "Space Mono", monospace`; c.textBaseline = 'middle'; c.textAlign = 'center';
      c.fillStyle = AC; c.fillText('{', X(13), Y(48)); c.fillText('}', X(87), Y(48)); c.fillStyle = INK;
      /** @type {[number, number[], number?][]} Einrückung, Segmentbreiten, erstes Segment hervorgehoben */
      const L = [[0, [16, 22]], [1, [12, 18], 1], [2, [20]], [2, [10, 14], 1], [1, [8]], [1, [18, 10]], [0, [12], 1]];
      const lh = 7.4, y0 = 48 - (L.length - 1) * lh / 2;
      L.forEach(([ind, segs, k], i) => { let x = 29 + ind * 5; segs.forEach((sw, j) => { c.fillStyle = k && j === 0 ? LT : INK; rr(c, X(x), Y(y0 + i * lh - 1.6), U(sw), U(3.2), U(1.6)); c.fill(); x += sw + 2.5; }); });
      c.fillStyle = INK;
    },
    (c, w, h) => {
      const { X, Y, U } = box(w, h, 0.96); c.lineWidth = LWf(w, h);
      rr(c, X(14), Y(12), U(72), U(76), U(5)); c.stroke();
      rr(c, X(20), Y(19), U(22), U(3.6), U(1.8)); c.fill();
      [[72, -1], [79, 1]].forEach(([x, d]) => { c.beginPath(); c.moveTo(X(x - d), Y(18.5)); c.lineTo(X(x + d), Y(20.8)); c.lineTo(X(x - d), Y(23.1)); c.stroke(); });
      const cell = 60 / 7, rh = 7.6;
      for (let r = 0; r < 5; r++) for (let q = 0; q < 7; q++) {
        if ((r === 0 && q < 2) || (r === 4 && q > 3)) continue;
        const cx = X(20 + cell * (q + .5)), cy = Y(30 + rh * (r + .5));
        if (r === 2 && q === 4) { c.fillStyle = AC; c.beginPath(); c.arc(cx, cy, U(3.4), 0, 7); c.fill(); c.fillStyle = INK; }
        else if ((r === 1 && q === 2) || (r === 3 && q === 5) || (r === 1 && q === 6)) { c.strokeStyle = LT; c.beginPath(); c.arc(cx, cy, U(3), 0, 7); c.stroke(); c.strokeStyle = INK; }
        else { c.beginPath(); c.arc(cx, cy, U(1), 0, 7); c.fill(); }
      }
      [0, 1, 2].forEach(i => { const x = 20 + i * 20.7; if (i === 1) { c.fillStyle = AC; rr(c, X(x), Y(73), U(18.6), U(7), U(3.5)); c.fill(); c.fillStyle = INK; } else { rr(c, X(x), Y(73), U(18.6), U(7), U(3.5)); c.stroke(); } });
    },
    (c, w, h) => {
      const { X, Y, U } = box(w, h, 0.96); c.lineWidth = LWf(w, h);
      c.beginPath(); c.moveTo(X(12), Y(12)); c.lineTo(X(12), Y(86)); c.lineTo(X(80), Y(86)); c.stroke();
      c.strokeStyle = LT; c.lineWidth = LWf(w, h) * .8;
      c.beginPath(); c.moveTo(X(12), Y(86)); c.lineTo(X(48), Y(86)); c.stroke(); c.beginPath(); c.moveTo(X(80), Y(16)); c.lineTo(X(44), Y(16)); c.stroke();
      c.strokeStyle = INK; c.lineWidth = LWf(w, h) * 1.5;
      c.beginPath(); c.moveTo(X(12), Y(86)); c.bezierCurveTo(X(48), Y(86), X(44), Y(16), X(80), Y(16)); c.stroke();
      c.fillStyle = AC; [[48, 86], [44, 16]].forEach(([x, y]) => { c.beginPath(); c.arc(X(x), Y(y), U(2.6), 0, 7); c.fill(); });
      const B = t => { const u = 1 - t; return 3 * u * u * t * 0 + 3 * u * t * t * 1 + t * t * t; };
      const ez = t => { let lo = 0, hi = 1; for (let k = 0; k < 20; k++) { const m = (lo + hi) / 2, u = 1 - m, x = 3 * u * u * m * .53 + 3 * u * m * m * .47 + m * m * m; x < t ? lo = m : hi = m; } return B(lo); };
      for (let k = 0; k <= 8; k++) { const t = k / 8, y = 86 - ez(t) * 70; c.fillStyle = k === 8 ? AC : LT; c.beginPath(); c.arc(X(92), Y(y), U(k === 8 ? 3 : 1.6), 0, 7); c.fill(); }
      c.fillStyle = INK;
    },
  ];


  const ring = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke(); };
  const dot = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); };
  const col = (c, k) => { c.fillStyle = c.strokeStyle = k; };
  const check = (c, x, y, s) => { c.beginPath(); c.moveTo(x - s, y); c.lineTo(x - s * .3, y + s * .7); c.lineTo(x + s, y - s * .7); c.stroke(); };
  const phone = (c, X, Y, U, L) => { c.lineWidth = L; rr(c, X(30), Y(6), U(40), U(88), U(6)); c.stroke(); rr(c, X(44), Y(9.5), U(12), U(2), U(1)); c.fill(); };
  const S = fn => (c, w, h) => { const b = box(w, h, 0.96); c.lineWidth = LWf(w, h); fn(c, b.X, b.Y, b.U, LWf(w, h)); col(c, INK); };

  const uxPersona = S((c, X, Y, U, L) => {
    rr(c, X(10), Y(14), U(80), U(72), U(5)); c.stroke();
    ring(c, X(28), Y(34), U(9)); c.beginPath(); c.arc(X(28), Y(60), U(15), Math.PI * 1.08, Math.PI * 1.92); c.stroke();
    rr(c, X(46), Y(26), U(30), U(4), U(2)); c.fill();
    col(c, LT); rr(c, X(46), Y(34), U(20), U(3), U(1.5)); c.fill(); col(c, INK);
    [44, 51, 58].forEach((y, i) => { dot(c, X(47.5), Y(y + 1.5), U(1.2)); rr(c, X(51), Y(y), U([24, 18, 21][i]), U(3), U(1.5)); c.fill(); });
    [[16, 0], [36, 1], [58, 0]].forEach(([x, on], i) => { const w = [18, 20, 22][i]; if (on) { col(c, AC); rr(c, X(x), Y(72), U(w), U(7), U(3.5)); c.fill(); col(c, INK); } else { rr(c, X(x), Y(72), U(w), U(7), U(3.5)); c.stroke(); } });
  });
  const uxJourney = S((c, X, Y, U, L) => {
    const nx = [14, 32, 50, 68, 86], ey = [40, 28, 62, 34, 22];
    c.lineWidth = L * .8; c.beginPath(); c.moveTo(X(8), Y(76)); c.lineTo(X(92), Y(76)); c.stroke();
    col(c, LT); c.lineWidth = L * 1.2; c.beginPath(); nx.forEach((x, i) => { i ? c.bezierCurveTo(X(nx[i - 1] + 9), Y(ey[i - 1]), X(x - 9), Y(ey[i]), X(x), Y(ey[i])) : c.moveTo(X(x), Y(ey[i])); }); c.stroke(); col(c, INK);
    nx.forEach((x, i) => { const pain = i === 2; col(c, pain ? AC : INK); dot(c, X(x), Y(ey[i]), U(pain ? 3.6 : 2.4)); col(c, INK); c.lineWidth = L * .6; c.setLineDash([U(1.2), U(1.6)]); c.beginPath(); c.moveTo(X(x), Y(ey[i] + 4)); c.lineTo(X(x), Y(73)); c.stroke(); c.setLineDash([]); ring(c, X(x), Y(76), U(2.2)); rr(c, X(x - 6), Y(82), U(12), U(2.6), U(1.3)); c.fill(); });
    col(c, AC); c.lineWidth = L; ring(c, X(50), Y(62), U(7)); col(c, INK);
  });
  const uxTest = S((c, X, Y, U, L) => {
    rr(c, X(6), Y(14), U(56), U(66), U(4)); c.stroke(); c.beginPath(); c.moveTo(X(6), Y(22)); c.lineTo(X(62), Y(22)); c.stroke();
    rr(c, X(11), Y(28), U(26), U(4), U(2)); c.fill(); rr(c, X(11), Y(36), U(40), U(3), U(1.5)); c.fill(); rr(c, X(11), Y(42), U(32), U(3), U(1.5)); c.fill();
    col(c, AC); rr(c, X(11), Y(54), U(20), U(8), U(4)); c.fill();
    col(c, LT); [7, 11.5].forEach(r => ring(c, X(21), Y(58), U(r))); col(c, INK);
    col(c, AC); c.beginPath(); const cx = X(26), cy = Y(60); c.moveTo(cx, cy); c.lineTo(cx, cy + U(10)); c.lineTo(cx + U(2.8), cy + U(7.4)); c.lineTo(cx + U(5), cy + U(12)); c.lineTo(cx + U(6.8), cy + U(11)); c.lineTo(cx + U(4.6), cy + U(6.8)); c.lineTo(cx + U(8.2), cy + U(6.4)); c.closePath(); c.fill(); col(c, INK);
    [26, 40, 54, 68].forEach((y, i) => { col(c, i < 3 ? AC : LT); c.lineWidth = L * 1.2; i < 3 ? check(c, X(72), Y(y), U(2.6)) : ring(c, X(72), Y(y), U(2.4)); col(c, INK); rr(c, X(78), Y(y - 1.5), U([14, 10, 12, 9][i]), U(3), U(1.5)); c.fill(); });
  });

  const devPlan = S((c, X, Y, U, L) => {
    [8, 38, 68].forEach((x, ci) => {
      rr(c, X(x), Y(12), U(16), U(3.4), U(1.7)); c.fill(); col(c, ci === 2 ? LT : INK); dot(c, X(x + 21), Y(13.7), U(1.6)); col(c, INK);
      const cards = [3, 2, 2][ci];
      for (let k = 0; k < cards; k++) { const y = 22 + k * 20; rr(c, X(x), Y(y), U(24), U(16), U(2.5)); ci === 2 ? (col(c, LT), c.fill(), col(c, INK)) : c.stroke(); rr(c, X(x + 3), Y(y + 4), U(14), U(2.6), U(1.3)); c.fill(); rr(c, X(x + 3), Y(y + 9), U(9), U(2.2), U(1.1)); c.fill(); }
    });
    col(c, AC); c.save(); c.translate(X(54), Y(66)); c.rotate(-0.08); rr(c, 0, 0, U(24), U(16), U(2.5)); c.fill(); c.restore();
    c.lineWidth = L; c.setLineDash([U(1.5), U(2)]); c.beginPath(); c.moveTo(X(32), Y(70)); c.quadraticCurveTo(X(42), Y(80), X(52), Y(74)); c.stroke(); c.setLineDash([]); col(c, INK);
  });
  const devArch = S((c, X, Y, U, L) => {
    const node = (x, y, w, h, fill) => { rr(c, X(x - w / 2), Y(y - h / 2), U(w), U(h), U(3)); if (fill) { col(c, fill); c.fill(); col(c, INK); } else c.stroke(); rr(c, X(x - w / 2 + 3), Y(y - 1.2), U(w * .45), U(2.4), U(1.2)); if (!fill) c.fill(); };
    const link = (a, b, ac) => { if (ac) col(c, AC); c.lineWidth = L * .9; c.beginPath(); c.moveTo(X(a[0]), Y(a[1])); c.lineTo(X(b[0]), Y(b[1])); c.stroke(); col(c, INK); };
    link([50, 22], [50, 42], 1); link([50, 58], [22, 74]); link([50, 58], [50, 74]); link([50, 58], [78, 74]);
    node(50, 16, 30, 12); node(50, 50, 34, 16, AC);
    node(22, 80, 22, 11); node(78, 80, 22, 11, LT);
    c.lineWidth = L; c.beginPath(); c.ellipse(X(50), Y(75), U(9), U(2.6), 0, 0, 7); c.stroke(); c.beginPath(); c.moveTo(X(41), Y(75)); c.lineTo(X(41), Y(86)); c.ellipse(X(50), Y(86), U(9), U(2.6), 0, Math.PI, 0, true); c.lineTo(X(59), Y(75)); c.stroke();
  });
  const devLaunch = S((c, X, Y, U, L) => {
    col(c, LT); c.lineWidth = U(4); ring(c, X(50), Y(42), U(26));
    col(c, AC); c.beginPath(); c.arc(X(50), Y(42), U(26), -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * .97); c.stroke(); col(c, INK);
    c.font = `700 ${U(17)}px "Space Mono", monospace`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('100', X(50), Y(43));
    c.lineWidth = L * 1.2; [16, 42, 68].forEach(x => { col(c, AC); check(c, X(x + 2), Y(82), U(2.4)); col(c, INK); rr(c, X(x + 6), Y(80.5), U(12), U(3), U(1.5)); c.fill(); });
  });

  const bkSlots = S((c, X, Y, U, L) => {
    phone(c, X, Y, U, L);
    rr(c, X(35), Y(17), U(18), U(3.4), U(1.7)); c.fill();
    [0, 1, 2, 3, 4].forEach(i => { const x = 37 + i * 6.5; if (i === 2) { col(c, AC); dot(c, X(x), Y(28), U(2.6)); col(c, INK); } else dot(c, X(x), Y(28), U(.9)); });
    for (let r = 0; r < 4; r++) for (let q = 0; q < 2; q++) { const x = 35 + q * 15.5, y = 37 + r * 10; const on = r === 1 && q === 1, off = r === 2 && q === 0; if (on) { col(c, AC); rr(c, X(x), Y(y), U(14), U(7), U(3.5)); c.fill(); col(c, INK); } else { if (off) col(c, LT); rr(c, X(x), Y(y), U(14), U(7), U(3.5)); c.stroke(); col(c, INK); } }
    col(c, LT); rr(c, X(35), Y(80), U(30), U(7), U(3.5)); c.fill(); col(c, INK);
  });
  const bkDone = S((c, X, Y, U, L) => {
    phone(c, X, Y, U, L);
    col(c, LT); ring(c, X(50), Y(36), U(15)); col(c, AC); dot(c, X(50), Y(36), U(11)); col(c, INK);
    c.save(); c.strokeStyle = '#000'; c.globalCompositeOperation = 'destination-out'; c.lineWidth = U(2.6); check(c, X(50), Y(36), U(5)); c.restore();
    rr(c, X(38), Y(58), U(24), U(3.6), U(1.8)); c.fill(); rr(c, X(41), Y(65), U(18), U(2.6), U(1.3)); c.fill();
    rr(c, X(35), Y(80), U(30), U(7), U(3.5)); c.stroke();
  });
  const bkRemind = S((c, X, Y, U, L) => {
    phone(c, X, Y, U, L);
    c.font = `700 ${U(11)}px "Space Mono", monospace`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('08:30', X(50), Y(26));
    rr(c, X(42), Y(34), U(16), U(2.4), U(1.2)); c.fill();
    col(c, LT); rr(c, X(33), Y(46), U(34), U(16), U(3.5)); c.fill(); col(c, AC); dot(c, X(39), Y(54), U(3)); col(c, INK);
    rr(c, X(45), Y(50), U(16), U(2.6), U(1.3)); c.fill(); rr(c, X(45), Y(55.5), U(11), U(2.2), U(1.1)); c.fill();
    rr(c, X(33), Y(66), U(34), U(12), U(3.5)); c.stroke(); rr(c, X(37), Y(70.5), U(18), U(2.4), U(1.2)); c.fill();
    c.lineWidth = L; col(c, AC); [5, 8].forEach(r => { c.beginPath(); c.arc(X(39), Y(54), U(r), -2.4, -0.7); c.stroke(); }); col(c, INK);
  });

  const mtKeys = S((c, X, Y, U, L) => {
    const rows = [30, 48, 66], keys = [[14, 40, 72], [22, 56], [14, 34, 62, 86]];
    rows.forEach((y, r) => { rr(c, X(8), Y(y - 1.6), U(6), U(3.2), U(1.6)); c.fill(); c.lineWidth = L * .6; c.beginPath(); c.moveTo(X(18), Y(y)); c.lineTo(X(92), Y(y)); c.stroke();
      keys[r].forEach((x, k) => { const on = r === 1 && k === 1; col(c, on ? AC : k % 2 ? LT : INK); c.save(); c.translate(X(x), Y(y)); c.rotate(Math.PI / 4); const s = U(on ? 3.6 : 2.6); c.fillRect(-s, -s, s * 2, s * 2); c.restore(); col(c, INK); }); });
    col(c, AC); c.lineWidth = L; c.beginPath(); c.moveTo(X(50), Y(18)); c.lineTo(X(50), Y(80)); c.stroke();
    c.beginPath(); c.moveTo(X(46), Y(14)); c.lineTo(X(54), Y(14)); c.lineTo(X(50), Y(19)); c.closePath(); c.fill(); col(c, INK);
    for (let i = 0; i <= 10; i++) { const x = 18 + i * 7.4; c.lineWidth = L * .5; c.beginPath(); c.moveTo(X(x), Y(84)); c.lineTo(X(x), Y(i % 5 ? 86 : 88)); c.stroke(); }
  });
  const mtPath = S((c, X, Y, U, L) => {
    c.lineWidth = L * .7; c.setLineDash([U(1), U(2)]); c.beginPath(); c.moveTo(X(10), Y(80)); c.bezierCurveTo(X(30), Y(10), X(70), Y(10), X(90), Y(70)); c.stroke(); c.setLineDash([]);
    const bz = t => { const u = 1 - t; return [u*u*u*10 + 3*u*u*t*30 + 3*u*t*t*70 + t*t*t*90, u*u*u*80 + 3*u*u*t*10 + 3*u*t*t*10 + t*t*t*70]; };
    [0, .05, .14, .28, .46, .64, .8, .92, 1].forEach((t, i, a) => { const [x, y] = bz(t), last = i === a.length - 1; col(c, last ? AC : LT); dot(c, X(x), Y(y), U(last ? 5 : 1.6 + i * .35)); });
    col(c, INK); c.lineWidth = L * .8; c.beginPath(); c.moveTo(X(84), Y(86)); c.lineTo(X(96), Y(86)); c.stroke();
  });
  const mtTap = S((c, X, Y, U, L) => {
    col(c, LT); [14, 22].forEach(r => ring(c, X(50), Y(48), U(r))); col(c, INK);
    col(c, AC); rr(c, X(30), Y(42), U(40), U(12), U(6)); c.fill(); col(c, INK);
    col(c, INK); c.beginPath(); const cx = X(56), cy = Y(52); c.moveTo(cx, cy); c.lineTo(cx, cy + U(11)); c.lineTo(cx + U(3), cy + U(8)); c.lineTo(cx + U(5.4), cy + U(13)); c.lineTo(cx + U(7.4), cy + U(12)); c.lineTo(cx + U(5), cy + U(7.4)); c.lineTo(cx + U(9), cy + U(7)); c.closePath(); c.fill();
    rr(c, X(34), Y(80), U(16), U(8), U(4)); c.stroke(); col(c, AC); dot(c, X(46), Y(84), U(2.6)); col(c, INK);
    rr(c, X(56), Y(82.6), U(12), U(2.8), U(1.4)); c.fill();
  });

  // Betreuung & Hosting: Server in Deutschland, Schutz, Updates, Ladezeit im Blick
  const careServer = (c, w, h) => {
    const { X, Y, U } = box(w, h, 0.9); c.lineWidth = LWf(w, h);
    [0, 1, 2].forEach(i => {
      const y = Y(18 + i * 24); rr(c, X(18), y, U(64), U(18), U(3)); c.stroke();
      c.fillStyle = i === 1 ? AC : LT; c.beginPath(); c.arc(X(28), y + U(9), U(3), 0, 7); c.fill(); c.fillStyle = INK;
      [0, 1, 2].forEach(k => { rr(c, X(42 + k * 11), y + U(7.5), U(8), U(3), U(1.5)); c.fill(); });
    });
  };
  const careShield = (c, w, h) => {
    const { X, Y } = box(w, h, 0.9); c.lineWidth = LWf(w, h) * 1.2;
    c.beginPath(); c.moveTo(X(50), Y(12)); c.lineTo(X(80), Y(24)); c.quadraticCurveTo(X(78), Y(70), X(50), Y(88));
    c.quadraticCurveTo(X(22), Y(70), X(20), Y(24)); c.closePath(); c.stroke();
    c.strokeStyle = AC; c.lineWidth = LWf(w, h) * 1.8;
    c.beginPath(); c.moveTo(X(36), Y(50)); c.lineTo(X(47), Y(61)); c.lineTo(X(66), Y(38)); c.stroke(); c.strokeStyle = INK;
  };
  const careUpdate = (c, w, h) => {
    const { X, Y, U } = box(w, h, 0.9); const r = U(30), cx = X(50), cy = Y(50); c.lineWidth = LWf(w, h) * 1.2;
    const arc = (a0, a1, color) => {
      c.strokeStyle = color; c.beginPath(); c.arc(cx, cy, r, a0, a1); c.stroke();
      arrowHead(c, cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, a1 + Math.PI / 2, U(7));
    };
    arc(Math.PI * 1.1, Math.PI * 1.9, INK); arc(Math.PI * 0.1, Math.PI * 0.9, AC); c.strokeStyle = INK;
    c.fillStyle = LT; rr(c, X(38), Y(45), U(24), U(10), U(5)); c.fill(); c.fillStyle = INK;
  };
  const careSpeed = (c, w, h) => {
    const { X, Y, U } = box(w, h, 0.9); c.lineWidth = LWf(w, h);
    rr(c, X(12), Y(18), U(76), U(64), U(4)); c.stroke(); rr(c, X(18), Y(25), U(22), U(3), U(1.5)); c.fill();
    const pts = [[20, 70], [32, 62], [44, 65], [56, 50], [68, 46], [80, 32]];
    c.strokeStyle = AC; c.lineWidth = LWf(w, h) * 1.4; c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(X(x), Y(y)) : c.moveTo(X(x), Y(y)))); c.stroke(); c.strokeStyle = INK;
    pts.forEach(([x, y]) => { c.beginPath(); c.arc(X(x), Y(y), U(2), 0, 7); c.fill(); });
  };

  const stories = [
    [uxPersona, uxJourney, services[0], uxTest],
    [devPlan, devArch, services[1], devLaunch],
    [services[2], bkSlots, bkDone, bkRemind],
    [mtKeys, services[3], mtPath, mtTap],
    [careServer, careShield, careUpdate, careSpeed],
  ];

  const browser = (c, w, h) => {
    const fx = w * .04, fy = h * .06, fw = w * .92, fh = h * .88, bar = fh * .1, L = LWf(w, h);
    c.lineWidth = L; rr(c, fx, fy, fw, fh, 14); c.stroke();
    c.beginPath(); c.moveTo(fx, fy + bar); c.lineTo(fx + fw, fy + bar); c.stroke();
    [0, 1, 2].forEach(i => { c.beginPath(); c.arc(fx + 18 + i * 14, fy + bar / 2, 4, 0, 7); c.fill(); });
    rr(c, fx + fw * .36, fy + bar * .28, fw * .28, bar * .44, 999); c.stroke();
    return { x: fx + fw * .05, y: fy + bar + fh * .07, w: fw * .9, h: fh - bar - fh * .12, L };
  };
  const bar = (c, x, y, w, h) => { rr(c, x, y, w, h, h / 2); c.fill(); };
  const projects = [
    (c, w, h) => {
      const A = browser(c, w, h), { x, y, w: W, h: H } = A;
      bar(c, x, y, W * .1, H * .045); [0, 1, 2].forEach(i => bar(c, x + W * (.62 + i * .1), y + H * .01, W * .07, H * .028));
      c.font = `semi-condensed 800 ${H * .13}px "Bricolage Grotesque"`; c.textBaseline = 'top'; c.lineWidth = H * .006;
      ['Train', 'stronger.'].forEach((t, i) => { c.fillText(t, x, y + H * (.14 + i * .15)); c.strokeText(t, x, y + H * (.14 + i * .15)); });
      c.fillStyle = AC; rr(c, x, y + H * .5, W * .17, H * .09, 999); c.fill(); c.fillStyle = INK;
      c.lineWidth = A.L; const sx = x + W * .46, sw = W * .54;
      ['Mo', 'Di', 'Mi', 'Do', 'Fr'].forEach((d, i) => { const dx = sx + i * sw / 5; if (i === 2) { c.fillStyle = AC; rr(c, dx, y + H * .12, sw / 5 - 8, H * .08, 6); c.fill(); c.fillStyle = INK; } else { rr(c, dx, y + H * .12, sw / 5 - 8, H * .08, 6); c.stroke(); } });
      for (let r = 0; r < 5; r++) { const ry = y + H * (.26 + r * .145); rr(c, sx, ry, sw, H * .11, 8); c.stroke(); bar(c, sx + 12, ry + H * .035, sw * .14, H * .04); bar(c, sx + sw * .24, ry + H * .035, sw * (.3 - r * .03), H * .04); if (r % 2 === 0) { c.fillStyle = LT; c.beginPath(); c.arc(sx + sw - 18, ry + H * .055, H * .022, 0, 7); c.fill(); c.fillStyle = INK; } }
      c.fillStyle = LT; rr(c, x, y + H * .7, W * .38, H * .3, 10); c.fill(); c.fillStyle = INK;
    },
    (c, w, h) => {
      const L = LWf(w, h); c.lineWidth = L;
      const ph = (px, py, pw, phh, kind) => {
        rr(c, px, py, pw, phh, pw * .14); c.stroke(); bar(c, px + pw * .38, py + phh * .035, pw * .24, phh * .018);
        const ix = px + pw * .12, iw = pw * .76;
        if (kind === 0) {
          c.strokeStyle = LT; [.26, .19, .12].forEach(r => { c.beginPath(); c.arc(px + pw / 2, py + phh * .27, pw * r, 0, 7); c.stroke(); }); c.strokeStyle = INK;
          c.fillStyle = AC; c.beginPath(); c.arc(px + pw / 2, py + phh * .27, pw * .05, 0, 7); c.fill(); c.fillStyle = INK;
          bar(c, ix, py + phh * .5, iw * .7, phh * .03); bar(c, ix, py + phh * .55, iw * .5, phh * .022);
          for (let r = 0; r < 2; r++) for (let q = 0; q < 3; q++) { const bx = ix + q * iw / 3, by = py + phh * (.63 + r * .08); if (r === 0 && q === 1) { c.fillStyle = AC; rr(c, bx, by, iw / 3 - 6, phh * .06, 999); c.fill(); c.fillStyle = INK; } else { rr(c, bx, by, iw / 3 - 6, phh * .06, 999); c.stroke(); } }
          rr(c, ix, py + phh * .84, iw, phh * .075, 999); c.fill();
        } else {
          bar(c, ix, py + phh * .1, iw * .5, phh * .035);
          for (let r = 0; r < 4; r++) { const ry = py + phh * (.18 + r * .16); c.fillStyle = r === 0 ? LT : INK; rr(c, ix, ry, iw * .3, phh * .12, 10); r === 0 ? c.fill() : c.stroke(); c.fillStyle = INK; bar(c, ix + iw * .38, ry + phh * .025, iw * .5, phh * .025); bar(c, ix + iw * .38, ry + phh * .07, iw * .3, phh * .02); }
          c.fillStyle = AC; rr(c, ix, py + phh * .84, iw, phh * .075, 999); c.fill(); c.fillStyle = INK;
        }
      };
      const pw = Math.min(w * .24, h * .48);
      ph(w * .5 - pw * 1.08, h * .06, pw, h * .88, 0);
      ph(w * .5 + pw * .12, h * .14, pw, h * .8, 1);
    },
    (c, w, h) => {
      const A = browser(c, w, h), { x, y, w: W, h: H } = A; c.lineWidth = A.L;
      bar(c, x, y, W * .12, H * .045);
      const tx = x + W * .04, ty = y + H * .38, tw = W * .44, td = H * .16;
      c.beginPath(); c.moveTo(tx, ty + td); c.lineTo(tx + tw * .25, ty); c.lineTo(tx + tw, ty); c.lineTo(tx + tw * .75, ty + td); c.closePath(); c.stroke();
      c.beginPath(); c.moveTo(tx, ty + td); c.lineTo(tx, ty + td + H * .04); c.lineTo(tx + tw * .75, ty + td + H * .04); c.lineTo(tx + tw, ty + H * .04); c.lineTo(tx + tw, ty); c.stroke();
      c.beginPath(); c.moveTo(tx + tw * .75, ty + td); c.lineTo(tx + tw * .75, ty + td + H * .04); c.stroke();
      [[.06, 1], [.7, 1], [.3, 0], [.95, 0]].forEach(([fx, front]) => { const lx = tx + tw * fx, ly = front ? ty + td + H * .04 : ty + H * .04; c.beginPath(); c.moveTo(lx, ly); c.lineTo(lx, ly + H * .3); c.stroke(); });
      c.strokeStyle = AC; c.beginPath(); c.moveTo(tx, ty + td + H * .44); c.lineTo(tx + tw * .75, ty + td + H * .44); c.stroke();
      arrowHead(c, tx, ty + td + H * .44, Math.PI, 10); arrowHead(c, tx + tw * .75, ty + td + H * .44, 0, 10); c.strokeStyle = INK;
      const px = x + W * .6, pw = W * .4;
      [0, 1, 2].forEach(i => { const py = y + H * (.12 + i * .22); bar(c, px, py, pw * .3, H * .035);
        if (i === 0) [0, 1, 2, 3].forEach(k => { const cx = px + 16 + k * pw * .22, cy = py + H * .11; c.fillStyle = k === 1 ? AC : k === 3 ? LT : INK; c.beginPath(); c.arc(cx, cy, H * .04, 0, 7); c.fill(); c.fillStyle = INK; });
        else [0, 1, 2].forEach(k => { const bx = px + k * pw / 3; rr(c, bx, py + H * .07, pw / 3 - 8, H * .08, 999); (i === 1 && k === 0) ? (c.fillStyle = LT, c.fill(), c.fillStyle = INK) : c.stroke(); }); });
      c.fillStyle = AC; rr(c, px, y + H * .82, pw, H * .1, 999); c.fill(); c.fillStyle = INK;
    },
    (c, w, h) => {
      const A = browser(c, w, h), { x, y, w: W, h: H } = A; c.lineWidth = A.L;
      const sw = W * .2; c.fillStyle = LT; rr(c, x, y, sw, H, 10); c.fill(); c.fillStyle = INK;
      [0, 1, 2, 3, 4].forEach(i => { if (i === 1) { c.fillStyle = AC; } bar(c, x + 14, y + H * (.08 + i * .1), sw * (i === 1 ? .6 : .5), H * .035); c.fillStyle = INK; });
      const mx = x + sw + W * .04, mw = W - sw - W * .04;
      [0, 1, 2].forEach(i => { const bx = mx + i * mw / 3; rr(c, bx, y, mw / 3 - 10, H * .22, 10); c.stroke(); bar(c, bx + 12, y + H * .05, mw * .1, H * .03); c.fillStyle = i === 0 ? AC : INK; bar(c, bx + 12, y + H * .12, mw * .16, H * .05); c.fillStyle = INK; });
      rr(c, mx, y + H * .28, mw * .6, H * .4, 10); c.stroke();
      c.strokeStyle = AC; c.lineWidth = A.L * 1.3; c.beginPath();
      [.1, .55, .35, .6, .3, .45, .15, .25].forEach((v, i, a) => { const px = mx + 16 + i * (mw * .6 - 32) / (a.length - 1), py = y + H * (.32 + v * .32); i ? c.lineTo(px, py) : c.moveTo(px, py); }); c.stroke();
      c.strokeStyle = INK; c.lineWidth = A.L;
      [0, 1, 2].forEach(i => { const ry = y + H * (.28 + i * .14), rx = mx + mw * .64; rr(c, rx, ry, mw * .36 - 4, H * .11, 10); c.stroke(); c.beginPath(); c.moveTo(rx + 14, ry + H * .03); c.lineTo(rx + 14, ry + H * .08); c.lineTo(rx + 22, ry + H * .055); c.closePath(); c.fill(); bar(c, rx + 32, ry + H * .042, mw * .14, H * .025); });
      bar(c, mx, y + H * .76, mw * .7, H * .035); bar(c, mx, y + H * .84, mw * .5, H * .035);
    },
  ];

  const contact = lang => [
    (c, w, h) => {
      const word = lang === 'EN' ? 'hello' : 'hallo';
      c.font = 'semi-condensed 800 100px "Bricolage Grotesque"'; const m = c.measureText(word).width / 100;
      const s = Math.min(h * 0.95, (w * 0.82) / (m + 0.2));
      c.font = `semi-condensed 800 ${s}px "Bricolage Grotesque"`; c.textBaseline = 'alphabetic'; c.lineWidth = s * 0.01;
      const tw = m * s, x = (w - tw - s * .16) / 2, y = h * 0.5 + s * 0.34;
      c.fillText(word, x, y); c.strokeText(word, x, y);
      c.fillStyle = AC; c.beginPath(); c.arc(x + tw + s * .1, y - s * .07, s * .07, 0, 7); c.fill(); c.fillStyle = INK;
    },
    (c, w, h) => {
      const r = Math.min(w, h) * .4, cx = w / 2, cy = h / 2; c.lineWidth = Math.max(3, r * .05);
      c.beginPath(); c.arc(cx, cy, r, 0, 7); c.stroke();
      c.strokeStyle = AC; c.lineWidth = r * .14; c.beginPath(); c.moveTo(cx - r * .42, cy + r * .02); c.lineTo(cx - r * .1, cy + r * .32); c.lineTo(cx + r * .46, cy - r * .3); c.stroke(); c.strokeStyle = INK;
    },
  ];

  
  


export { services, stories, projects, contact };
export default { services, stories, projects, contact };
