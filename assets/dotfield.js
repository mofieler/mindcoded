// @ts-check
/**
 * Mindcoded Studio - DotField Engine
 * Interactive Canvas Particle & Dot System with Spring Physics & Shape Sampling
 * 
 * Features:
 * - Desktop: Mouse hover tracking, spring displacement & morphing
 * - Mobile: Touch drag & swipe morphing (touchmove coordinates + horizontal swipe detection)
 * - Retina DPR support with auto-resize
 * - Multi-color passes with depth simulation
 * - Lowers resolution and dot count on slow devices (measured frame times, perf.js)
 */

import { createFrameMonitor, onQualityChange, quality } from './perf.js';
import { sampleShape } from './shape-sample.js';

/**
 * Ein Punkt: Position (x, y), Geschwindigkeit (vx, vy), Ruheplatz (bx, by), Zufallswerte (u, j),
 * Akzentfarbe (acc) und Index der Form, zu der er gerade gehört (s, -1 = frei).
 * @typedef {{ x: number, y: number, vx: number, vy: number, bx: number, by: number, u: number, j: number, acc: boolean, s: number }} Particle
 */
/** @typedef {import('./shape-sample.js').Sample} Sample */

export class DotField {
  constructor(canvas, options = {}) {
    this.cv = canvas;
    this.o = options;
    this.cur = -1;
    this.want = this.o.initial ?? 0;
    /** @type {Particle[]} */
    this.P = [];
    /** @type {Sample[] | null} */
    this.S = null;
    /** Fläche in CSS-Pixeln und Zahl der Punkte – setzt resize() */
    this.W = 0;
    this.H = 0;
    this.N = 0;
    this.col = new Uint8Array(0);
    this.md = new Uint8Array(0);
    /** @type {number | null} */
    this.raf = null;
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    this.rt = undefined;
    this.T = 0;
    this.since = 0;
    this.mouse = { x: -1e4, y: -1e4 };
    this.visible = false;
    this.colors = this.o.colors; // aus den CSS-Tokens über tokens.js
    this.reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.paused = Boolean(this.o.paused);
    this.host = this.o.host || canvas.parentElement || canvas;

    // Mobile touch tracking & swipe state
    this.touchActive = false;
    this.touchStartPos = { x: 0, y: 0, time: 0 };
    this.onSwipe = this.o.onSwipe || null; // Callback for swipe: (direction, deltaX) => {}

    this.bindEvents();

    // Schwaches Gerät gemessen: mit weniger Pixeln und Punkten neu aufbauen.
    this.monitor = createFrameMonitor();
    this.offQuality = onQualityChange(() => this.resize());

    this.ro = new ResizeObserver(() => {
      clearTimeout(this.rt);
      this.rt = setTimeout(() => this.resize(), 120);
    });
    this.ro.observe(canvas);

    if (this.o.manual) {
      this.resize();
      return;
    }

    this.io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const v = e.isIntersecting && e.intersectionRatio >= (this.o.threshold ?? 0.35);
        if (v && !this.visible) {
          this.visible = true;
          this.enter();
          this.start();
        } else if (!e.isIntersecting && this.visible) {
          this.visible = false;
          this.leave();
        }
      });
    }, { threshold: [0, 0.2, 0.35, 0.5, 0.8] });

    this.io.observe(canvas);
    this.resize();
  }

  bindEvents() {
    // 1. Pointer & Mouse Events (Desktop)
    this.onMove = e => {
      if (e.pointerType === 'touch') return; // Handled specifically by touch handlers for smoother gesture math
      const r = this.cv.getBoundingClientRect();
      this.mouse.x = e.clientX - r.left;
      this.mouse.y = e.clientY - r.top;
    };

    this.onLeave = () => {
      if (!this.touchActive) {
        this.mouse.x = -1e4;
        this.mouse.y = -1e4;
      }
    };

    this.host.addEventListener('pointermove', this.onMove, { passive: true });
    this.host.addEventListener('pointerleave', this.onLeave, { passive: true });

    // 2. Touch Events (Mobile Drag & Swipe Morphing)
    this.onTouchStart = e => {
      if (!e.touches || e.touches.length === 0) return;
      const t = e.touches[0];
      const r = this.cv.getBoundingClientRect();
      this.touchActive = true;
      this.mouse.x = t.clientX - r.left;
      this.mouse.y = t.clientY - r.top;
      this.touchStartPos = {
        x: t.clientX,
        y: t.clientY,
        time: performance.now()
      };
    };

    this.onTouchMove = e => {
      if (!e.touches || e.touches.length === 0) return;
      const t = e.touches[0];
      const r = this.cv.getBoundingClientRect();
      
      this.mouse.x = t.clientX - r.left;
      this.mouse.y = t.clientY - r.top;

      // Check if this is a horizontal swipe gesture
      const dx = t.clientX - this.touchStartPos.x;
      const dy = t.clientY - this.touchStartPos.y;
      
      // If horizontal movement strongly dominates, prevent scrolling to allow fluid swiping & morphing
      if (Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 10) {
        if (e.cancelable && this.o.preventScrollOnSwipe) {
          e.preventDefault();
        }
      }
    };

    this.onTouchEnd = e => {
      this.touchActive = false;
      const endTime = performance.now();
      const dt = endTime - this.touchStartPos.time;

      if (e.changedTouches && e.changedTouches.length > 0) {
        const t = e.changedTouches[0];
        const dx = t.clientX - this.touchStartPos.x;
        const dy = t.clientY - this.touchStartPos.y;

        // Swipe threshold: > 35px horizontal, under 500ms, dx dominates dy
        if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.2 && dt < 500) {
          const dir = dx < 0 ? 'left' : 'right';
          if (this.onSwipe) {
            this.onSwipe(dir, dx);
          }
          // Pulse at center when swiped
          if (this.W && this.H) {
            this.pulse(this.W / 2, this.H / 2, 10);
          }
        }
      }

      // Smoothly release mouse position
      setTimeout(() => {
        if (!this.touchActive) {
          this.mouse.x = -1e4;
          this.mouse.y = -1e4;
        }
      }, 100);
    };

    // Attach to host and canvas
    const target = this.cv;
    target.addEventListener('touchstart', this.onTouchStart, { passive: true });
    target.addEventListener('touchmove', this.onTouchMove, { passive: !this.o.preventScrollOnSwipe });
    target.addEventListener('touchend', this.onTouchEnd, { passive: true });
    target.addEventListener('touchcancel', this.onTouchEnd, { passive: true });
  }

  setDraws(d) {
    this.draws = d;
    this.resample();
  }

  setColors(cols) {
    this.colors = cols;
    if (!this.raf && this.visible) this.frame(0, true);
  }

  /** Ruhemodus: reduzierte Bewegung oder vom Nutzer angehalten – nur Einzelbilder. */
  get calm() {
    return this.paused || this.reduce;
  }

  setPaused(paused) {
    this.paused = paused;
    if (paused) {
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = null;
      if (this.visible) this.frame(0, true);
    } else if (this.visible) {
      this.start();
    }
  }

  resize() {
    const r = this.cv.getBoundingClientRect();
    const w = r.width;
    const h = r.height;
    if (w < 8 || h < 8) return;

    const q = quality();
    const dpr = q.dpr;
    this.cv.width = w * dpr;
    this.cv.height = h * dpr;
    this.ctx = this.cv.getContext('2d');
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = w;
    this.H = h;
    this.N = Math.round(Math.min(this.o.max || 2600, Math.max(500, w * h / (this.o.per || 70))) * q.density);
    this.resample();
    if (this.visible) this.frame(0, this.calm);
  }

  resample() {
    if (!this.draws || !this.W) return;
    const R = { x: 0, y: 0, w: this.W, h: this.H };
    this.S = this.draws.map(d => sampleShape(d, R, this.N));
    const old = this.P;
    this.P = Array.from({ length: this.N }, (_, i) => {
      const o = old[i];
      const bx = Math.random() * this.W;
      const by = Math.random() * this.H;
      if (o) {
        o.bx = bx;
        o.by = by;
        return o;
      }
      return {
        x: bx + (Math.random() - .5) * 80,
        y: this.o.soft ? by : -20 - Math.random() * this.H * 0.6,
        vx: 0,
        vy: 0,
        bx,
        by,
        u: Math.random(),
        j: Math.random() * 6.28,
        acc: Math.random() < .08,
        s: -1
      };
    });
  }

  activate() {
    this.visible = true;
    this.enter();
    this.start();
  }

  deactivate() {
    this.visible = false;
    this.cur = -1;
    for (const p of this.P) p.s = -1;
    if (this.ctx) this.ctx.clearRect(0, 0, this.W, this.H);
  }

  burst(x, y) {
    for (const p of this.P) {
      const a = Math.random() * 6.283;
      const v = 4 + Math.random() * 14;
      p.x = x + (Math.random() - .5) * 10;
      p.y = y + (Math.random() - .5) * 10;
      p.vx = Math.cos(a) * v;
      p.vy = Math.sin(a) * v;
      p.s = -1;
    }
  }

  show(i) {
    this.want = i;
    if (this.visible && i !== this.cur) {
      this.cur = i;
      this.since = this.T;
    }
    if (this.visible && !this.raf) this.frame(0, true);
  }

  enter() {
    this.cur = this.want;
    this.since = this.T;
  }

  leave() {
    this.cur = -1;
    for (const p of this.P) {
      p.s = -1;
      p.x = p.bx + (Math.random() - .5) * 60;
      p.y = this.o.soft ? p.by + (Math.random() - .5) * 40 : -20 - Math.random() * this.H * 0.5;
      p.vx = p.vy = 0;
    }
  }

  pulse(x, y, k = 12) {
    for (const p of this.P) {
      const dx = p.x - x;
      const dy = p.y - y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < 360) {
        const f = (1 - d / 360) * k;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }
    }
  }

  start() {
    if (this.raf) return;
    if (this.calm) {
      this.frame(0, true);
      return;
    }
    let last = performance.now();
    const tick = now => {
      this.monitor.sample(now - last);
      const dt = Math.min(.05, (now - last) / 1000);
      last = now;
      this.T += dt;
      this.frame(dt);
      this.raf = this.visible ? requestAnimationFrame(tick) : null;
    };
    this.raf = requestAnimationFrame(tick);
  }

  frame(dt, still = false) {
    const c = this.ctx;
    if (!c || !this.S) return;

    const f = dt * 60;
    const damp = Math.pow(this.o.damp || .84, f);
    const T = this.T;
    const m = this.mouse;
    const MR = this.o.mr || 90;
    const st = this.o.stagger ?? 0.7;
    const n = this.P.length;

    if (this.col.length !== n) {
      this.col = new Uint8Array(n);
      this.md = new Uint8Array(n);
    }

    c.clearRect(0, 0, this.W, this.H);

    for (let i = 0; i < n; i++) {
      const p = this.P[i];
      if (still) {
        p.s = this.cur;
      } else if (p.s !== this.cur && T - this.since > p.u * st) {
        p.s = this.cur;
      }

      const S = p.s >= 0 ? this.S[p.s] : null;
      let tx, ty;

      if (S) {
        const jit = this.o.soft ? .35 : .6;
        tx = S.p[i * 2] + Math.sin(T * 1.3 + p.j) * jit;
        ty = S.p[i * 2 + 1] + Math.cos(T * 1.1 + p.j) * jit;
        this.col[i] = S.c[i];
        this.md[i] = 2;
      } else {
        const a1 = T * .35 + p.by * .01 + p.j;
        const a2 = T * .28 + p.bx * .009;
        tx = p.bx + Math.sin(a1) * 26;
        ty = p.by + Math.cos(a2) * 26;
        this.col[i] = p.acc ? 1 : 0;
        this.md[i] = 1;
      }

      // Mouse / Touch displacement & morphing
      const dx = tx - m.x;
      const dy = ty - m.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < MR * MR) {
        const dd = Math.sqrt(d2) || 1;
        const q = 1 - dd / MR;
        const push = q * q * MR * .55;
        tx += (dx / dd) * push;
        ty += (dy / dd) * push;
      }

      if (this.reduce || still || (dt === 0 && S)) {
        p.x = tx;
        p.y = ty;
      } else {
        const kk = this.o.spring || .055;
        p.vx = (p.vx + (tx - p.x) * kk * f) * damp;
        p.vy = (p.vy + (ty - p.y) * kk * f) * damp;
        p.x += p.vx * f;
        p.y += p.vy * f;
      }
    }

    // 3 passes for depth & colors
    for (let pass = 0; pass < 3; pass++) {
      c.fillStyle = this.colors[pass];
      for (let i = 0; i < n; i++) {
        if (this.col[i] !== pass) continue;
        const p = this.P[i];
        const md = this.md[i];
        const v = Math.min(1, Math.hypot(p.vx, p.vy) / 14);
        const a = (md === 2 ? .92 : .22 + v * .4) * (this.o.soft && !still ? Math.min(1, .25 + (this.T - this.since) / 1.4) : 1);
        const z = md === 2 ? (pass ? 2.2 : 1.9) : 1.5;

        if (v > .45 && md !== 2 && !this.o.soft) {
          c.globalAlpha = a * .35;
          c.fillRect(p.x - p.vx * 1.2, p.y - p.vy * 1.2, z, z);
        }
        c.globalAlpha = a;
        c.fillRect(p.x - z / 2, p.y - z / 2, z, z);
      }
    }
    c.globalAlpha = 1;
  }

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    this.visible = false;
    this.offQuality();
    this.ro.disconnect();
    if (this.io) this.io.disconnect();
    this.host.removeEventListener('pointermove', this.onMove);
    this.host.removeEventListener('pointerleave', this.onLeave);
    this.cv.removeEventListener('touchstart', this.onTouchStart);
    this.cv.removeEventListener('touchmove', this.onTouchMove);
    this.cv.removeEventListener('touchend', this.onTouchEnd);
    this.cv.removeEventListener('touchcancel', this.onTouchEnd);
  }
}

export default DotField;
