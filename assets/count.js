// @ts-check
/**
 * mindcoded.studio — Zahlen fürs Hochzählen: zerlegen und Zwischenstände formatieren.
 * Rein (ohne DOM), in tests/browser/unit.js getestet; genutzt von projects.js › initCountUp.
 * Nur reine Zahlen mit optionalem »%« zählen hoch; Spannen wie »200–400« bleiben stehen.
 */

const PATTERN = /^(\d+(?:[.,]\d+)?)(\s?%?)$/;

/** @typedef {{ num: string, unit: string, value: number, decimals: number, comma: boolean }} CountTarget */

/**
 * @param {string} text sichtbarer Endwert, z. B. »61,5 %«
 * @returns {CountTarget | null} null, wenn der Text nicht hochzählen soll
 */
export function parseCount(text) {
  const m = text.trim().match(PATTERN);
  if (!m) return null;
  const [, num, unit] = m;
  return { num, unit, value: parseFloat(num.replace(',', '.')), decimals: (num.split(/[.,]/)[1] || '').length, comma: num.includes(',') };
}

/**
 * Zwischenstand in der Schreibweise des Endwerts (Dezimalstellen, Komma, Einheit).
 * @param {CountTarget} target
 * @param {number} value
 */
export function formatCount(target, value) {
  let text = value.toFixed(target.decimals);
  if (target.comma) text = text.replace('.', ',');
  return text + target.unit;
}
