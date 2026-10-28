// @ts-check
/**
 * mindcoded.studio — Rechenaufgabe für den Spam-Schutz des Formulars (Proof-of-Work,
 * ALTCHA-kompatibel). Gesucht ist die Zahl n, für die SHA-256(salt + n) der Aufgabe entspricht.
 * Reine Logik ohne DOM: läuft im Worker (pow-worker.js) und in den Einheitentests.
 * Der Server prüft die Lösung in api/lib/challenge.php.
 */

/** @typedef {{ algorithm: string, challenge: string, maxnumber: number, salt: string, signature: string }} PowTask */

const encoder = new TextEncoder();
const BATCH = 250;

/** @param {ArrayBuffer} buffer */
const toHex = buffer => Array.from(new Uint8Array(buffer), b => b.toString(16).padStart(2, '0')).join('');

/**
 * @param {string} text
 * @returns {Promise<string>}
 */
export async function sha256Hex(text) {
  return toHex(await crypto.subtle.digest('SHA-256', encoder.encode(text)));
}

/**
 * Prüft die Form einer Aufgabe vom Server, bevor gerechnet wird.
 * @param {unknown} task
 * @returns {task is PowTask}
 */
export function isPowTask(task) {
  if (!task || typeof task !== 'object') return false;
  const t = /** @type {Record<string, unknown>} */ (task);
  return t.algorithm === 'SHA-256' && typeof t.challenge === 'string' && /^[0-9a-f]{64}$/.test(t.challenge)
    && typeof t.salt === 'string' && typeof t.signature === 'string'
    && Number.isInteger(t.maxnumber) && /** @type {number} */ (t.maxnumber) > 0;
}

/**
 * Sucht die Lösung und liefert das Feld »altcha« (Base64-JSON) – oder null ohne Treffer.
 * @param {PowTask} task
 * @returns {Promise<string | null>}
 */
export async function solvePow(task) {
  // In Blöcken parallel hashen – deutlich schneller als einzeln nacheinander
  for (let start = 0; start <= task.maxnumber; start += BATCH) {
    const numbers = Array.from({ length: Math.min(BATCH, task.maxnumber - start + 1) }, (_, i) => start + i);
    const hashes = await Promise.all(numbers.map(n => sha256Hex(task.salt + n)));
    const hit = hashes.indexOf(task.challenge);
    if (hit >= 0) {
      const { algorithm, challenge, salt, signature } = task;
      return btoa(JSON.stringify({ algorithm, challenge, number: numbers[hit], salt, signature }));
    }
  }
  return null;
}
