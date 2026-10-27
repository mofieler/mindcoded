// @ts-check
/**
 * mindcoded.studio — Leistungswächter für die Punktwolken.
 *
 * Misst auf dem tatsächlichen Gerät, wie lange Bilder brauchen, statt Gerätetypen zu raten.
 * Liegt der Median über ein Messfenster dauerhaft über dem Budget (schwaches Handy,
 * Energiesparmodus, viele offene Tabs), sinkt die Qualität für alle Animationen der Seite eine
 * Stufe: weniger Pixel (Auflösung) und weniger Punkte. Nie zurück nach oben – das würde
 * pendeln. Gespeichert wird nichts; jede Seite misst neu.
 */

export const QUALITY_LEVELS = [
  { dpr: 2, density: 1 },      // Standard
  { dpr: 1.5, density: 0.7 },  // spürbar langsames Gerät
  { dpr: 1, density: 0.45 },   // sehr langsam
];

const BUDGET_MS = 25;   // Median über 25 ms ≈ unter 40 Bildern pro Sekunde
const WINDOW = 90;      // Bilder je Messfenster
const WARMUP = 30;      // erste Bilder nach Start oder Umstellung nicht werten (Aufbau, Schriften)
const GAP_MS = 250;     // längere Pausen (Tab im Hintergrund, Scrollen) nicht werten

let level = 0;
const listeners = new Set();

/** Reine Auswertung eines Messfensters (auch von den Browser-Tests genutzt). */
export function isSlow(frameTimes, budget = BUDGET_MS) {
  if (frameTimes.length < WINDOW / 3) return false;
  const sorted = [...frameTimes].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] > budget;
}

/** Aktuelle Qualitätsstufe – Auflösung höchstens so hoch wie die des Bildschirms. */
export function quality() {
  const q = QUALITY_LEVELS[level];
  return { level, density: q.density, dpr: Math.min(q.dpr, window.devicePixelRatio || 1) };
}

/** Wird aufgerufen, wenn die Qualität sinkt. Liefert eine Funktion zum Abmelden. */
export function onQualityChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function lower() {
  if (level >= QUALITY_LEVELS.length - 1) return;
  level += 1;
  listeners.forEach(fn => fn(quality()));
}

/** Messung für eine Animationsschleife: sample() mit der Dauer jedes Bildes aufrufen. */
export function createFrameMonitor() {
  let samples = [];
  let warmup = WARMUP;
  let seenLevel = level;
  return {
    sample(ms) {
      if (level >= QUALITY_LEVELS.length - 1) return;
      if (seenLevel !== level) {   // eine andere Animation hat die Stufe schon gesenkt
        seenLevel = level;
        samples = [];
        warmup = WARMUP;
      }
      if (ms > GAP_MS) return;
      if (warmup > 0) {
        warmup -= 1;
        return;
      }
      samples.push(ms);
      if (samples.length < WINDOW) return;
      const slow = isSlow(samples);
      samples = [];
      if (slow) {
        lower();
        seenLevel = level;
        warmup = WARMUP;
      }
    },
  };
}
