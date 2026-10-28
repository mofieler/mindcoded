// @ts-check
/**
 * mindcoded.studio — Kontaktbereich: Punktwolke auf dunklem Grund und das Formular
 * (Prüfung, Versand, Zustände: contact-form.js).
 */

import { $, createField, data, motion } from './context.js';
import { initContactForm } from './contact-form.js';
import { contact as contactShapes } from './shapes.js';
import { track } from './analytics.js';

export function initContact() {
  const cv = $('#contact-canvas');
  /** @type {any} Punktwolke (dotfield.js, noch ohne Typprüfung) */
  let field = null;
  if (cv) {
    field = createField(cv, { per: 45, max: 2600, threshold: 0.5, soft: true, spring: 0.04, damp: 0.86, stagger: 1.1, mr: 110 }, true);
    field.setDraws(contactShapes((data.lang || 'de').toUpperCase()));
    field.show(0);
  }
  const form = $('#contact-form');
  if (form instanceof HTMLFormElement && data.contact) {
    initContactForm(form, {
      ...data.contact,
      // Besucherstatistik: nur die Ereignisse, nie Eingaben
      onStart: () => track('Kontaktformular begonnen'),
      onError: reason => track('Kontaktformular fehlgeschlagen', { grund: reason }),
      onSuccess: () => {
        track('Kontaktformular gesendet');
        if (!field) return;
        field.show(1);
        if (field.W && !motion.paused) field.pulse(field.W / 2, field.H / 2, 4);
      },
      onReset: () => field && field.show(0),
    });
  }
}
