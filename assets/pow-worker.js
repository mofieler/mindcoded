// @ts-check
/**
 * mindcoded.studio — rechnet die Aufgabe des Spam-Schutzes im Hintergrund (Web Worker),
 * damit die Seite währenddessen flüssig bleibt. Nachricht rein: Aufgabe; raus: Lösung oder null.
 */

import { isPowTask, solvePow } from './pow.js';

/** Worker-Kontext: postMessage ohne Ziel-Origin (die DOM-Typen kennen nur window.postMessage) */
const scope = /** @type {{ postMessage: (message: unknown) => void }} */ (/** @type {unknown} */ (globalThis));

globalThis.addEventListener('message', async event => {
  const task = /** @type {MessageEvent} */ (event).data;
  scope.postMessage(isPowTask(task) ? await solvePow(task).catch(() => null) : null);
});
