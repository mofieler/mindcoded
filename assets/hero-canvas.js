// @ts-check
/**
 * Mindcoded Studio - Hero Canvas Controller
 *
 * Features:
 * - Multi-stage particle morphing: Identity (01) -> Architecture (02) -> Code (03)
 * - Finale: the booking UI as desktop -> tablet -> phone, elements rearrange (hero-ui.js)
 * - Intro: centred wordmark while the hero text is hidden (decided early in theme-init.js);
 *   only when arriving from another site (no storage needed), any interaction skips it
 * - Pause/resume (WCAG 2.2.2), stops rendering while off-screen or in a hidden tab
 * - Lowers resolution and dot count on slow devices (measured frame times, perf.js)
 * - Desktop: Mouse hover tracking and particle displacement
 * - Mobile: Touch drag morphing + horizontal swipe to cycle stages
 */

import { brackets, code, head, headOutline, monoWord, monoWordC, wordmark, wordmarkC } from './hero-motifs.js';
import { buildResponsiveUi } from './hero-ui.js';
import { createFrameMonitor, onQualityChange, quality } from './perf.js';
import { sampleShape } from './shape-sample.js';

const INTRO_CLASS = 'intro-pending';
// Zeitachse (Sekunden im Zyklus): Motiv je Startzeit, -1 = freie Punkte. Motive (this.S):
// 0 Kopf · 1 Klammern · 2 Code · 3–5 Oberfläche als Desktop, Tablet, Handy (hero-ui.js).
const CYCLE = 18.4;
const STARTS = [0, 1.2, 4.4, 6.0, 8.4, 11.2, 13.6, 16.8];
const SHAPES = [-1, 0, 1, 2, 3, 4, 5, -1];
const HEAD_AT = 1;      // Index in STARTS: Kopf zeichnet erst den Umriss, dann das Gehirn …
const HEAD_SPEED = 1.2; // … 1,2× so schnell wie ursprünglich (Stufe 3,8 s → 3,2 s)
const CODE = 2;         // Code-Zeilen bauen sich der Reihe nach auf …
const CODE_FILL = 1.3;  // … innerhalb dieser Sekunden
const RESPONSIVE = 4;   // ab diesem Motiv wandern die Elemente als Ganzes (Verzögerung je Element)
const TAP = 16.0;       // »Tippen« auf den Anfrage-Button der Handy-Ansicht
const STILL = 9.8;      // ruhiges Einzelbild bei reduzierter Bewegung: Desktop-Ansicht
// Zeitfenster der drei Stufen Identity, Architecture, Code – für Fortschrittsbalken und Wischen.
const STAGES = [[1.2, 4.4], [4.4, 8.4], [8.4, 16.8]];

/** @typedef {import('./shape-sample.js').Rect} Rect */
/** @typedef {import('./shape-sample.js').Sample} Sample */
/**
 * Ein Punkt der Wolke: Position, Geschwindigkeit, Ruheplatz (bx, by), Zufallswerte (u, q, j),
 * Akzentfarbe, Reihenfolge r (0–1) und Startverzögerung ud beim Umordnen der Oberfläche.
 * @typedef {{ x: number, y: number, vx: number, vy: number, bx: number, by: number, u: number, q: number,
 *   acc: boolean, j: number, r: number, ud: number }} HeroDot
 */
/**
 * @typedef {{ lang?: string, getColors: () => Record<string, string>,
 *   isWide: () => boolean, speed?: number, introSpeed?: number, density?: number, interactive?: boolean,
 *   paused?: boolean, topInset?: () => number, onStageChange?: ((stage: number) => void) | null,
 *   onIntroEnd?: (() => void) | null }} HeroOptions
 */

export class HeroCanvas {
  /**
   * @param {HTMLElement} sectionEl
   * @param {HTMLCanvasElement} canvasEl
   * @param {HeroOptions} options
   */
  constructor(sectionEl, canvasEl, options) {
    this.sec = sectionEl;
    this.cv = canvasEl;
    this.options = options;
    this.lang = options.lang || 'DE';
    // Farben und Breakpoint kommen aus den CSS-Einstellungen (über app.js / tokens.js) – keine Werte hier.
    this.getColors = options.getColors;
    this.colors = this.getColors();
    this.isWide = options.isWide;
    this.speed = options.speed || 1;
    this.introSpeed = options.introSpeed || 1.6;
    this.density = options.density || 1;
    this.interactive = options.interactive !== false;
    this.paused = Boolean(options.paused);
    this.onScreen = true;
    /** @type {number | null} */
    this.raf = null;
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    this.rt = undefined;
    /** @type {CanvasRenderingContext2D | null} */
    this.ctx = null;
    this.W = 0;
    this.H = 0;
    /** Zeit im Zyklus (s) des zuletzt gezeichneten Frames */
    this.tm = 0;
    /** Motive in Koordinaten des Hero (build); null ohne sichtbare Motivfläche */
    /** @type {Sample[] | null} */
    this.S = null;
    /** @type {Sample | null} Umriss des Kopfes, bevor das Gehirn erscheint */
    this.HO = null;
    /** @type {Sample[]} Intro-Wortmarke */
    this.I = [];
    /** @type {Rect} Fläche der Intro-Wortmarke */
    this.IR = { x: 0, y: 0, w: 10, h: 10 };
    /** @type {((ink: string | CanvasGradient, acc: string | CanvasGradient) => import('./shape-sample.js').ShapeDraw) | null} */
    this.solidDraw = null;
    /** @type {{ x: number, y: number, radius: number } | null} */
    this.tap = null;
    this.mode = new Uint8Array(0);
    this.colr = new Uint8Array(0);
    this.monitor = createFrameMonitor();
    /** @type {(() => void) | null} */
    this.onSkip = null;
    // Ereignis-Handler setzt bindEvents()
    /** @type {(e: PointerEvent) => void} */
    this.onMove = () => {};
    /** @type {() => void} */
    this.onLeave = () => {};
    /** @type {(e: TouchEvent) => void} */
    this.onTouchStart = () => {};
    /** @type {(e: TouchEvent) => void} */
    this.onTouchMove = () => {};
    /** @type {(e: TouchEvent) => void} */
    this.onTouchEnd = () => {};
    /** @type {string[]} */
    this.skipEvents = [];
    /** @type {() => void} */
    this.onVisibility = () => this.refresh();
    /** @type {ResizeObserver | null} */
    this.ro = null;
    /** @type {IntersectionObserver | null} */
    this.io = null;
    /** @type {(() => void) | null} */
    this.offQuality = null;

    this.mouse = { x: -1e4, y: -1e4 };
    this.touchActive = false;
    this.touchStart = { x: 0, y: 0, time: 0 };

    /** @type {HeroDot[]} */
    this.P = [];
    this.T = 0;
    this.clock = 0;
    this.lastMain = 0;
    this.rippled = false;
    this.stage = -1;

    this.L = CYCLE;
    this.starts = STARTS;
    this.ids = SHAPES;

    this.reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.wide = this.isWide();

    // Callbacks
    this.onStageChange = options.onStageChange || null;
    this.onIntroEnd = options.onIntroEnd || null;

    this.init();
  }

  D() {
    return this.wide ? 4.4 : 4.9;
  }

  init() {
    this.bindEvents();
    this.build();

    // Schwaches Gerät gemessen: mit weniger Pixeln und Punkten neu aufbauen.
    this.offQuality = onQualityChange(() => {
      this.build();
      if (!this.raf) this.still();
    });

    if (this.shouldSkipIntro()) this.clock = this.D() + 1.6;

    this.ro = new ResizeObserver(() => {
      clearTimeout(this.rt);
      this.rt = setTimeout(() => {
        this.build();
        if (!this.raf) this.still();
      }, 140);
    });
    this.ro.observe(this.sec);

    // Schriften werden in die Punktwolke gerastert – nach dem Laden neu aufbauen.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { this.build(); this.refresh(); });
    }

    // Nur rendern, solange der Hero sichtbar ist und der Tab im Vordergrund liegt.
    this.io = new IntersectionObserver(entries => {
      this.onScreen = entries.some(e => e.isIntersecting);
      this.refresh();
    });
    this.io.observe(this.sec);
    document.addEventListener('visibilitychange', this.onVisibility);

    this.refresh();
  }

  /**
   * Ob das Intro läuft, entscheidet theme-init.js schon im <head> (Klasse »intro-pending«),
   * damit der Hero-Text vor dem Intro nicht kurz aufblitzt. Hier wird die Entscheidung nur gelesen.
   */
  shouldSkipIntro() {
    if (this.reduce || this.paused) return true;
    return !document.documentElement.classList.contains(INTRO_CLASS);
  }

  skipIntro() {
    const D = this.D();
    if (this.clock < D) this.clock = D;
  }

  setPaused(paused) {
    this.paused = paused;
    if (paused) this.skipIntro();
    this.refresh();
  }

  /** Startet oder stoppt die Schleife je nach Pause, Sichtbarkeit und Tab-Zustand. */
  refresh() {
    const run = !this.paused && !this.reduce && this.onScreen && !document.hidden;
    if (run) {
      this.loop();
    } else {
      this.stop();
      this.still();
    }
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
  }

  /** Ein ruhiges Einzelbild: Punkte sitzen direkt auf ihrer Zielform. */
  still() {
    if (!this.ctx) return;
    const D = this.D();
    if (this.clock < D) this.clock = D + 1.6;
    this.tm = this.reduce ? STILL : Math.max(0, this.clock - D) % this.L;
    this.bars(this.tm);
    this.frame(0, D, true);
  }

  bindEvents() {
    // Desktop mouse interaction
    this.onMove = e => {
      if (e.pointerType === 'touch') return;
      const r = this.sec.getBoundingClientRect();
      this.mouse.x = e.clientX - r.left;
      this.mouse.y = e.clientY - r.top;
    };

    this.onLeave = () => {
      if (!this.touchActive) {
        this.mouse.x = -1e4;
        this.mouse.y = -1e4;
      }
    };

    this.sec.addEventListener('pointermove', this.onMove, { passive: true });
    this.sec.addEventListener('pointerleave', this.onLeave, { passive: true });

    // Mobile touch interaction & swipe morphing
    this.onTouchStart = e => {
      if (!e.touches || e.touches.length === 0) return;
      const t = e.touches[0];
      const r = this.sec.getBoundingClientRect();
      this.touchActive = true;
      this.mouse.x = t.clientX - r.left;
      this.mouse.y = t.clientY - r.top;
      this.touchStart = { x: t.clientX, y: t.clientY, time: performance.now() };
    };

    this.onTouchMove = e => {
      if (!e.touches || e.touches.length === 0) return;
      const t = e.touches[0];
      const r = this.sec.getBoundingClientRect();
      this.mouse.x = t.clientX - r.left;
      this.mouse.y = t.clientY - r.top;
    };

    this.onTouchEnd = e => {
      this.touchActive = false;
      const dt = performance.now() - this.touchStart.time;
      if (e.changedTouches && e.changedTouches.length > 0) {
        const t = e.changedTouches[0];
        const dx = t.clientX - this.touchStart.x;
        const dy = t.clientY - this.touchStart.y;

        // Horizontal swipe on mobile Hero jumps to next/previous hero stage
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3 && dt < 450) {
          this.stepStage(dx < 0 ? 1 : -1);
        }
      }
      setTimeout(() => {
        if (!this.touchActive) {
          this.mouse.x = -1e4;
          this.mouse.y = -1e4;
        }
      }, 120);
    };

    this.sec.addEventListener('touchstart', this.onTouchStart, { passive: true });
    this.sec.addEventListener('touchmove', this.onTouchMove, { passive: true });
    this.sec.addEventListener('touchend', this.onTouchEnd, { passive: true });
    this.sec.addEventListener('touchcancel', this.onTouchEnd, { passive: true });

    // Jede Interaktion beendet das Intro sofort – niemand soll warten müssen.
    this.skipEvents = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    const onSkip = () => this.skipIntro();
    this.onSkip = onSkip;
    this.skipEvents.forEach(t => window.addEventListener(t, onSkip, { passive: true }));
  }

  unbindSkip() {
    const onSkip = this.onSkip;
    if (!onSkip) return;
    this.skipEvents.forEach(t => window.removeEventListener(t, onSkip));
    this.onSkip = null;
  }

  stepStage(delta) {
    const D = this.D();
    const currentTm = Math.max(0, this.clock - D) % this.L;
    const currentIdx = Math.max(0, STAGES.findIndex(([from, to]) => currentTm >= from && currentTm < to));
    const nextIdx = (currentIdx + delta + STAGES.length) % STAGES.length;
    this.clock = D + STAGES[nextIdx][0] + 0.1;
    if (!this.raf) {
      // Angehalten: nur die neue Stufe ruhig zeigen, ohne Bewegung.
      this.clock += 2.5;
      this.still();
      return;
    }

    // Displace dots for dynamic feedback
    if (this.W && this.H) {
      for (const p of this.P) {
        const a = Math.random() * 6.28;
        const v = 3 + Math.random() * 8;
        p.vx += Math.cos(a) * v;
        p.vy += Math.sin(a) * v;
      }
    }
  }

  /** Nach einem Wechsel des Farbschemas die Farben neu aus den Tokens lesen. */
  refreshColors() {
    this.colors = this.getColors();
    if (!this.raf) this.still();
  }

  hexRgb(h) {
    if (!h) return [0, 0, 0];
    const n = parseInt(h.slice(1), 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  }

  build() {
    if (!this.sec || !this.cv) return;
    const W = this.sec.clientWidth;
    const H = this.sec.clientHeight;
    const q = quality();
    const dpr = q.dpr;
    const wide = this.isWide();
    this.wide = wide;

    this.cv.width = W * dpr;
    this.cv.height = H * dpr;
    const ctx = this.cv.getContext('2d');
    if (!ctx) return;
    this.ctx = ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = W;
    this.H = H;

    const lang = this.lang;
    // Es gibt eine Motivfläche für Desktop und eine für Mobil – nur die sichtbare zählt.
    const stageBox = [...this.sec.querySelectorAll('[data-hero-stage-box]')].find(el => el.getClientRects().length > 0);
    const secRect = this.sec.getBoundingClientRect();
    /** @type {Rect | null} */
    let R = null;
    if (stageBox) {
      const b = stageBox.getBoundingClientRect();
      if (b.width >= 40 && b.height >= 40) {
        R = { x: b.left - secRect.left, y: b.top - secRect.top, w: b.width, h: b.height };
      }
    }
    // Freie Punkte bleiben unterhalb des Headers, damit die Navigation lesbar bleibt.
    const top = Math.max(0, Math.min(H * 0.4, typeof this.options.topInset === 'function' ? this.options.topInset() : 0));

    const N = Math.round((wide ? Math.min(4200, Math.max(1800, (R ? R.w * R.h : W * H * .3) / 60)) : Math.min(1700, Math.max(900, W * H / 260))) * this.density * q.density);

    // Intro-Wortzeichen mittig – Überschrift und Header sind währenddessen ausgeblendet (CSS: .intro-pending).
    const IR = wide ? { x: W * 0.07, y: H * 0.34, w: W * 0.86, h: H * 0.3 } : { x: W * 0.06, y: H * 0.36, w: W * 0.88, h: Math.min(H * 0.24, W * 0.5) };
    this.IR = { x: IR.x, y: IR.y, w: Math.max(10, Math.round(IR.w)), h: Math.max(10, Math.round(IR.h)) };
    this.solidDraw = (ink, acc) => wide ? wordmarkC(ink, acc, true) : monoWordC('coded', true, ink, acc, true);
    this.I = wide ? [sampleShape(wordmark, IR, N)] : [sampleShape(monoWord('mind', false), IR, N), sampleShape(monoWord('coded', true), IR, N)];

    /** @type {ReturnType<typeof buildResponsiveUi> | null} */
    let ui = null;
    if (R) {
      this.HO = sampleShape(headOutline, R, N);
      ui = buildResponsiveUi({ R, N, lang });
      this.S = [sampleShape(head, R, N), sampleShape(brackets, R, N), sampleShape(code, R, N, true), ...ui.shapes];
      this.tap = { ...ui.tap, radius: Math.min(420, R.w * .7) };
    } else {
      this.S = null;
      this.tap = null;
    }

    const old = this.P;
    this.P = Array.from({ length: N }, (_, i) => {
      const o = old[i];
      const u = Math.random();
      const bx = wide ? W * (0.4 + 0.6 * Math.pow(Math.random(), 0.6)) : (Math.random() < .5 ? W * .16 * Math.pow(Math.random(), .7) : W * (1 - .16 * Math.pow(Math.random(), .7)));
      const by = top + Math.random() * (H - top);
      // Umordnung der Oberfläche: alle Punkte eines Elements starten gemeinsam (leicht gestreut).
      const ud = ui ? ui.delay[i] + Math.random() * 0.08 : 0;
      if (o) {
        o.bx = bx;
        o.by = by;
        o.ud = ud;
        return o;
      }
      return {
        ud,
        x: bx,
        y: by,
        vx: 0,
        vy: 0,
        bx,
        by,
        u,
        q: Math.random(),
        acc: Math.random() < .08,
        j: Math.random() * 6.28,
        r: i / N
      };
    });
  }

  stageOf(p, t) {
    let s = -1;
    for (let k = 0; k < this.starts.length; k++) {
      const id = this.ids[k];
      const dl = id >= RESPONSIVE ? p.ud : id === CODE ? p.r * CODE_FILL : id === 0 ? p.u * 0.3 / HEAD_SPEED : (k % 2 ? p.u : 1 - p.u) * 0.55 + p.q * 0.25;
      if (t >= this.starts[k] + (k === 0 ? 0 : dl)) s = id;
    }
    return s;
  }

  stageNow(t) {
    let s = -1;
    for (let k = 0; k < this.starts.length; k++) {
      if (t >= this.starts[k]) s = this.ids[k];
    }
    return s;
  }

  /** Fortschrittsbalken und aktive Stufe – die Anzeige gibt es zweimal (Desktop, Mobil). */
  bars(t) {
    const active = STAGES.findIndex(([a, b]) => t >= a && t < b);
    this.sec.querySelectorAll('[data-pbar]').forEach(el => {
      if (!(el instanceof HTMLElement)) return;
      const i = Number(el.dataset.pbar);
      const [a, b] = STAGES[i] || [0, 1];
      el.style.width = (Math.max(0, Math.min(1, (t - a) / (b - a))) * 100).toFixed(1) + '%';
      const item = el.closest('.hero-stage-item');
      if (item) item.classList.toggle('is-active', i === active);
    });
  }

  loop() {
    if (this.raf) return;
    let last = performance.now();
    const tick = now => {
      this.monitor.sample(now - last);
      const dt = Math.min(.05, (now - last) / 1000);
      last = now;
      const D = this.D();
      // Intro läuft beschleunigt, danach normales Tempo.
      const sp = this.clock < D + 1.6 ? this.speed * this.introSpeed : this.speed;
      this.T += dt;
      this.clock += dt * sp;

      if (this.clock >= D && !this.introEnded) {
        this.introEnded = true;
        this.unbindSkip();
        if (this.onIntroEnd) this.onIntroEnd();
      }

      const tm = Math.max(0, this.clock - D) % this.L;
      if (tm < this.lastMain) this.rippled = false;
      this.lastMain = tm;
      this.tm = tm;

      const g = this.S && this.clock >= D ? this.stageNow(tm) : -1;
      if (g !== this.stage) {
        this.stage = g;
        if (this.onStageChange) this.onStageChange(g);
      }

      this.bars(tm);
      this.frame(dt, D);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  frame(dt, D, still = false) {
    const c = this.ctx;
    if (!c || !this.I) return;
    if (still && !this.introEnded) {
      this.introEnded = true;
      this.unbindSkip();
      if (this.onIntroEnd) this.onIntroEnd();
    }

    const { ink: inkS, accent, accentSoft: brainS } = this.colors;
    const inter = this.interactive;
    const f = dt * 60;
    const damp = Math.pow(.84, f);
    const T = this.T;
    const m = this.mouse;
    const MR = 120;
    const ci = this.clock;
    const tm = this.tm;

    const calm = this.reduce || still;
    // Am Ende »tippt« jemand auf den Anfrage-Button der Handy-Ansicht: kurzer Impuls nach außen.
    if (this.S && this.tap && !calm && !this.rippled && tm > TAP && tm < this.starts[this.starts.length - 1]) {
      this.rippled = true;
      const { x, y, radius } = this.tap;
      for (const p of this.P) {
        const dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy) || 1;
        if (d < radius) {
          const kk = (1 - d / radius) * 15;
          p.vx += dx / d * kk;
          p.vy += dy / d * kk;
        }
      }
    }

    c.clearRect(0, 0, this.W, this.H);

    const sm = x => {
      x = Math.max(0, Math.min(1, x));
      return x * x * (3 - 2 * x);
    };
    const sa = calm ? 0 : sm((ci - (D - 2.05)) / 0.55) * (1 - sm((ci - (D - 0.25)) / 1.05));
    const lock = !calm && ci >= D - 1.45;
    const snap = lock && ci < D + 0.4;
    const pf = lock ? sm((ci - (D + 0.5)) / 1.2) : 1;

    const P = this.P, n = P.length;
    if (!this.mode || this.mode.length !== n) {
      this.mode = new Uint8Array(n);
      this.colr = new Uint8Array(n);
    }

    for (let i = 0; i < n; i++) {
      const p = P[i];
      let tx, ty, ac, md;

      if (!lock && ci < D + p.u * 0.5 + p.q * 0.3) {
        if (ci < 0.35 + p.u * 0.6) {
          tx = p.bx + Math.sin(T * .6 + p.by * .01) * 30;
          ty = p.by + Math.cos(T * .5 + p.bx * .01) * 30;
          ac = 0; md = 0;
        } else {
          const S = (this.I.length > 1 && ci >= 1.9 + p.u * 0.5) ? this.I[1] : this.I[0];
          tx = S.p[i * 2];
          ty = S.p[i * 2 + 1];
          ac = S.c[i];
          md = 2;
        }
      } else {
        const s = this.S && ci >= D ? this.stageOf(p, tm) : -1;
        if (s < 0) {
          const a1 = T * .35 + p.by * .008 + p.j, a2 = T * .28 + p.bx * .007;
          tx = p.bx + Math.sin(a1) * 38 + Math.sin(a2 * 1.7) * 14;
          ty = p.by + Math.cos(a2) * 38 + Math.cos(a1 * 1.3) * 14;
          ac = p.acc ? 1 : 0; md = 1;
        } else {
          const S0 = /** @type {Sample[]} */ (this.S)[s];
          ac = S0.c[i];
          const S = (s === 0 && ac === 2 && this.HO && tm < this.starts[HEAD_AT] + (0.6 + p.q * 0.7) / HEAD_SPEED) ? this.HO : S0;
          tx = S.p[i * 2] + Math.sin(T * 1.3 + p.j) * .7;
          ty = S.p[i * 2 + 1] + Math.cos(T * 1.1 + p.j) * .7;
          md = 2;
        }
      }

      if (calm || snap) {
        p.x = tx; p.y = ty; p.vx = 0; p.vy = 0;
      } else {
        p.vx = (p.vx + (tx - p.x) * .055 * f) * damp;
        p.vy = (p.vy + (ty - p.y) * .055 * f) * damp;
        if (inter) {
          const dx = p.x - m.x, dy = p.y - m.y, d2 = dx * dx + dy * dy;
          if (d2 < MR * MR) {
            const d = Math.sqrt(d2) || 1, kk = (1 - d / MR) * 4.5 * f;
            p.vx += dx / d * kk;
            p.vy += dy / d * kk;
          }
        }
        p.x += p.vx * f;
        p.y += p.vy * f;
      }
      this.mode[i] = md;
      this.colr[i] = ac;
    }

    for (let pass = 0; pass < 3; pass++) {
      c.fillStyle = pass === 2 ? brainS : pass ? accent : inkS;
      for (let i = 0; i < n; i++) {
        if (this.colr[i] !== pass) continue;
        const p = P[i], md = this.mode[i], v = Math.min(1, Math.hypot(p.vx, p.vy) / 14);
        const a = (md === 0 ? .3 : md === 1 ? .38 + v * .4 : .92) * (lock ? pf : md === 2 && ci < D ? 1 - sa : 1);
        const z = md === 2 ? (pass ? 2.25 : 2) : 1.6;
        if (v > .2) {
          c.globalAlpha = a * .35;
          c.fillRect(p.x - p.vx * 1.2, p.y - p.vy * 1.2, z, z);
        }
        c.globalAlpha = a;
        c.fillRect(p.x - z / 2, p.y - z / 2, z, z);
      }
    }

    if (sa > 0.001 && this.solidDraw) {
      const R = this.IR, ar2 = this.hexRgb(accent), out = ci > D - 0.25, sc = out ? 1 + (1 - sa) * 0.03 : 1 + (1 - sa) * 0.012;
      c.save();
      c.globalAlpha = sa;
      c.translate(R.x + R.w / 2, R.y + R.h / 2 - (out ? (1 - sa) * 14 : 0));
      c.scale(sc, sc);
      c.translate(-R.w / 2, -R.h / 2);
      c.shadowColor = `rgba(${ar2.join(',')},${(0.45 * sa).toFixed(3)})`;
      c.shadowBlur = 26 * sa;
      c.shadowOffsetY = 0;
      this.solidDraw(inkS, accent)(c, R.w, R.h);
      c.shadowColor = 'rgba(0,0,0,0.35)';
      c.shadowBlur = 10;
      c.shadowOffsetY = 4;
      c.globalAlpha = sa * 0.5;
      this.solidDraw(inkS, accent)(c, R.w, R.h);
      c.shadowColor = 'transparent';
      c.shadowBlur = 0;
      c.shadowOffsetY = 0;

      const sp = Math.max(0, Math.min(1, (ci - (D - 1.55)) / 0.9));
      if (sp > 0 && sp < 1) {
        const gx = -R.w * 0.25 + sp * R.w * 1.5, g = c.createLinearGradient(gx - R.w * 0.12, 0, gx + R.w * 0.12, R.h * 0.3);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(0.5, 'rgba(255,255,255,0.55)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        c.globalAlpha = sa * Math.sin(sp * Math.PI);
        this.solidDraw(g, g)(c, R.w, R.h);
      }
      c.restore();
    }
    c.globalAlpha = 1;
  }

  destroy() {
    this.stop();
    this.unbindSkip();
    this.offQuality && this.offQuality();
    this.ro && this.ro.disconnect();
    this.io && this.io.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.sec.removeEventListener('pointermove', this.onMove);
    this.sec.removeEventListener('pointerleave', this.onLeave);
    this.sec.removeEventListener('touchstart', this.onTouchStart);
    this.sec.removeEventListener('touchmove', this.onTouchMove);
    this.sec.removeEventListener('touchend', this.onTouchEnd);
    this.sec.removeEventListener('touchcancel', this.onTouchEnd);
  }
}

export default HeroCanvas;
