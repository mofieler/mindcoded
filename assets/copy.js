// @ts-check
/**
 * mindcoded.studio — »Kopieren«-Knöpfe (Komponenten-Seite im Entwicklungs-Build):
 * [data-copy="<id>"] kopiert den Text des Elements mit dieser ID in die Zwischenablage.
 * Rückmeldung im Knopf selbst (data-copy-done / data-copy-fail), danach wieder die Beschriftung.
 */

import { $$ } from './context.js';

export function initCopy() {
  $$('[data-copy]').forEach(btn => {
    const label = btn.textContent;
    btn.addEventListener('click', async () => {
      const source = document.getElementById(btn.dataset.copy || '');
      if (!source) return;
      try {
        await navigator.clipboard.writeText(source.textContent || '');
        btn.textContent = btn.dataset.copyDone || label;
      } catch (err) {
        btn.textContent = btn.dataset.copyFail || label;
      }
      setTimeout(() => { btn.textContent = label; }, 1800);
    });
  });
}
