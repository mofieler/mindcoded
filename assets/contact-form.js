// @ts-check
/**
 * mindcoded.studio — Kontaktformular (Progressive Enhancement)
 *
 * Ohne JavaScript sendet das Formular klassisch an api/contact.php und landet auf
 * einer Danke- oder Fehlerseite. Mit JavaScript:
 * - Prüfung im Browser (dieselben Grenzen wie auf dem Server, aus der Seite übergeben)
 * - Versand per fetch; die Erfolgsmeldung erscheint NUR, wenn der Server
 *   {"ok": true} bestätigt
 * - Lade-, Fehler- und Erfolgszustand; Eingaben bleiben bei Fehlern erhalten
 * - Warnung vor dem Verlassen der Seite, solange ungesendete Eingaben im Formular stehen.
 *   Gespeichert wird dafür nichts: Bei Links innerhalb der Website stellt der Browser die
 *   Eingaben beim Zurückgehen selbst wieder her; die Warnung greift nur beim Neuladen,
 *   Schließen oder Verlassen der Website.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TIMEOUT_MS = 15000;

/** @typedef {{ name: string, email: string, message: string, consent?: boolean }} ContactValues */
/** @typedef {{ nameMax: number, emailMax: number, messageMin: number, messageMax: number }} ContactLimits */
/** @typedef {Partial<Record<'name' | 'email' | 'message' | 'consent', string>>} FieldErrors */
/** @typedef {{ ok?: boolean, fields?: Record<string, string> }} ServerPayload */
/** @typedef {{ href: string, label: string }} StatusLink */

/**
 * Element, auf das sich ein Ereignis bezieht – oder null (Text-Knoten, Fenster).
 * @param {Event} event
 */
const targetEl = event => (event.target instanceof Element ? event.target : null);

/**
 * Reine Prüffunktion – auch von den Browser-Tests genutzt.
 * @param {Partial<ContactValues>} values
 * @param {ContactLimits} limits
 * @returns {FieldErrors}
 */
export function validateContact(values, limits, requireConsent = false) {
  /** @type {FieldErrors} */
  const errors = {};
  const name = (values.name || '').trim();
  const email = (values.email || '').trim();
  const message = (values.message || '').trim();

  if (!name) errors.name = 'required';
  else if (name.length > limits.nameMax) errors.name = 'nameTooLong';

  if (!email) errors.email = 'required';
  else if (email.length > limits.emailMax || !EMAIL_RE.test(email)) errors.email = 'email';

  if (!message) errors.message = 'required';
  else if (message.length < limits.messageMin) errors.message = 'messageTooShort';
  else if (message.length > limits.messageMax) errors.message = 'messageTooLong';

  if (requireConsent && !values.consent) errors.consent = 'consent';
  return errors;
}

/**
 * Thema aus der Adresse (?thema=website bzw. ?topic=website) – nur erlaubte Werte.
 * @param {string} search
 * @param {string[]} allowed
 */
export function topicFromSearch(search, allowed) {
  const params = new URLSearchParams(search);
  const topic = params.get('thema') || params.get('topic');
  return topic && allowed.includes(topic) ? topic : null;
}

/**
 * Hakt ein Thema im Formular an (z. B. nach »Dazu anfragen« bei einer Leistung).
 * @param {HTMLFormElement} form
 * @param {string | undefined} topic
 */
export function selectTopic(form, topic) {
  const box = [...form.querySelectorAll('input[name="topics[]"]')]
    .find(input => input instanceof HTMLInputElement && input.value === topic);
  if (!(box instanceof HTMLInputElement)) return false;
  box.checked = true;
  return true;
}

/**
 * Stehen ungesendete Eingaben im Formular? Leerzeichen und vorausgewählte Themen zählen nicht.
 * @param {Partial<ContactValues>} values
 */
export function hasUnsentInput(values) {
  return ['name', 'email', 'message'].some(key => (values[key] || '').trim() !== '');
}

/**
 * Führt ein Klick die Besucherin auf eine andere Seite derselben Website? (dann keine Warnung)
 * @param {Element | null | { href?: string, target?: string, hasAttribute(name: string): boolean }} link
 * @param {{ href: string, origin: string, pathname: string, search: string }} location
 */
export function isInternalNavigation(link, location) {
  const a = /** @type {{ href?: string, target?: string, hasAttribute(name: string): boolean } | null} */ (link);
  if (!a || !a.href || a.target === '_blank' || a.hasAttribute('download')) return false;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return false;
  return url.pathname !== location.pathname || url.search !== location.search;
}

/**
 * Notausgang, wenn der Versand scheitert: mailto-Link mit Betreff und Nachricht, damit niemand
 * neu tippen muss. Länge begrenzt (manche Mailprogramme kappen lange mailto-Adressen).
 * @param {string} email
 * @param {string} subject
 * @param {Partial<ContactValues>} values
 * @returns {string | null}
 */
export function mailtoFallback(email, subject, values, maxBody = 1800) {
  if (!/^[^\s@?&]+@[^\s@?&]+\.[^\s@?&]+$/.test(email || '')) return null;
  const name = (values.name || '').trim();
  const sign = name ? `\n\n– ${name}` : '';
  let body = (values.message || '').trim();
  if (body.length + sign.length > maxBody) body = `${body.slice(0, Math.max(0, maxBody - sign.length - 1))}…`;
  return `mailto:${email}?subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(body + sign)}`;
}

/**
 * Server-Fehlercodes (contact.php) → Meldungsschlüssel im Frontend.
 * @param {Record<string, string>} fields
 * @returns {FieldErrors}
 */
export function mapServerErrors(fields = {}) {
  /** @type {Record<string, Record<string, string>>} */
  const map = {
    name: { required: 'required', too_long: 'nameTooLong' },
    email: { required: 'required', invalid: 'email', too_long: 'email' },
    message: { required: 'required', too_short: 'messageTooShort', too_long: 'messageTooLong' },
    consent: { required: 'consent' },
  };
  /** @type {Record<string, string>} */
  const out = {};
  for (const [field, code] of Object.entries(fields)) {
    if (map[field] && map[field][code]) out[field] = map[field][code];
  }
  return out;
}

/**
 * @param {HTMLFormElement} form
 * @param {{ endpoint: string, limits: ContactLimits, requireConsent: boolean, send: string, sending: string,
 *   errors: Record<string, string>, onSuccess?: () => void, onReset?: () => void, topics?: string[],
 *   fallback?: { email: string, subject: string, label: string } }} options
 */
export function initContactForm(form, options) {
  const { endpoint, limits, requireConsent, send, sending, errors: messages, onSuccess, onReset, topics = [], fallback } = options;

  // Vorauswahl: von einer Leistungsseite (…?thema=website#kontakt) oder »Dazu anfragen«
  const preset = topicFromSearch(window.location.search, topics);
  if (preset) selectTopic(form, preset);
  document.addEventListener('click', event => {
    const link = targetEl(event)?.closest('[data-topic-select]');
    if (link instanceof HTMLElement) selectTopic(form, link.dataset.topicSelect);
  });
  const status = form.querySelector('#contact-status');
  const submitBtn = form.querySelector('[type="submit"]');
  const submitLabel = form.querySelector('[data-submit-label]');
  const thanks = document.getElementById('contact-thanks-card');
  if (!status || !submitBtn || !submitLabel || !thanks) throw new Error('Kontaktformular: Markup unvollständig');
  const resetBtn = document.getElementById('contact-reset-btn');
  /**
   * Formularfeld per Name – null, wenn es fehlt (z. B. ohne Einwilligungsfeld).
   * @param {string} name
   */
  const field = name => {
    const el = form.elements.namedItem(name);
    return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ? el : null;
  };
  const elapsed = field('elapsed');
  /** @type {Record<keyof FieldErrors, string>} */
  const fieldIds = { name: 'cf-name', email: 'cf-email', message: 'cf-message', consent: 'cf-consent' };
  const fieldNames = /** @type {(keyof FieldErrors)[]} */ (Object.keys(fieldIds));
  let busy = false;
  let attempted = false;
  /** @type {number | null} */
  let startedAt = null;

  // Eigene, verständliche Prüfung statt Browser-Blasen
  form.setAttribute('novalidate', '');

  // Spam-Schutz: Ausfülldauer seit der ersten Interaktion. performance.now() ist monoton
  // und unabhängig von der Uhrzeit des Geräts – eine falsch gehende Uhr schadet nicht.
  form.addEventListener('focusin', () => {
    if (startedAt === null) startedAt = performance.now();
  });

  /** @returns {ContactValues} */
  const values = () => {
    const consent = field('consent');
    return {
      name: field('name')?.value ?? '',
      email: field('email')?.value ?? '',
      message: field('message')?.value ?? '',
      consent: consent instanceof HTMLInputElement ? consent.checked : true,
    };
  };

  /**
   * @param {keyof FieldErrors} name
   * @param {string | undefined} key
   */
  const setFieldError = (name, key) => {
    const input = document.getElementById(fieldIds[name]);
    const error = document.getElementById(`${fieldIds[name]}-error`);
    if (!input || !error) return;
    if (key) {
      input.setAttribute('aria-invalid', 'true');
      error.textContent = messages[key] || messages.required;
      error.hidden = false;
    } else {
      input.removeAttribute('aria-invalid');
      error.textContent = '';
      error.hidden = true;
    }
  };

  /** @param {FieldErrors} errs */
  const showErrors = (errs, focus = true) => {
    fieldNames.forEach(name => setFieldError(name, errs[name]));
    const first = fieldNames.find(name => errs[name]);
    if (first && focus) {
      setStatus(messages.summary, true);
      document.getElementById(fieldIds[first])?.focus();
    }
    return Boolean(first);
  };

  /**
   * @param {string} text
   * @param {StatusLink | null} [link]
   */
  const setStatus = (text, isError = false, link = null) => {
    status.textContent = text || '';
    if (link && link.href) {
      const a = document.createElement('a');
      a.className = 'text-link';
      a.href = link.href;
      a.textContent = link.label;
      status.append(' ', a);
    }
    status.classList.toggle('is-error', Boolean(text) && isError);
  };

  // aria-disabled statt disabled: Der Button behält den Fokus, damit nach einem Fehler
  // sofort erneut gesendet werden kann. Doppelte Absendungen verhindert »busy«.
  /** @param {boolean} state */
  const setBusy = state => {
    busy = state;
    form.setAttribute('aria-busy', String(state));
    submitBtn.setAttribute('aria-disabled', String(state));
    submitLabel.textContent = state ? sending : send;
  };

  // Ungesendete Eingaben: vor Neuladen, Schließen oder Verlassen der Website nachfragen.
  // Der Listener hängt nur, solange etwas im Formular steht (sonst bleibt der Back-Forward-Cache nutzbar).
  let internalNav = false;
  /** @param {BeforeUnloadEvent} event */
  const warnOnLeave = event => {
    if (internalNav) return;
    event.preventDefault();
    event.returnValue = '';
  };
  const updateLeaveGuard = () => {
    const guard = hasUnsentInput(values());
    window.removeEventListener('beforeunload', warnOnLeave);
    if (guard) window.addEventListener('beforeunload', warnOnLeave);
  };
  form.addEventListener('input', updateLeaveGuard);
  document.addEventListener('click', event => {
    const link = targetEl(event)?.closest('a[href]') ?? null;
    if (!isInternalNavigation(link, window.location)) return;
    internalNav = true;
    setTimeout(() => { internalNav = false; }, 1000); // falls die Navigation doch nicht stattfindet
  }, true);
  window.addEventListener('pageshow', () => { internalNav = false; });

  // Nach dem ersten Absende-Versuch Fehler beim Verlassen eines Feldes aktualisieren
  form.addEventListener('focusout', event => {
    if (!attempted) return;
    const id = targetEl(event)?.id;
    const name = fieldNames.find(key => fieldIds[key] === id);
    if (name) setFieldError(name, validateContact(values(), limits, requireConsent)[name]);
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    attempted = true;
    setStatus('');

    if (showErrors(validateContact(values(), limits, requireConsent))) return;

    if (elapsed) elapsed.value = startedAt === null ? '' : String(Math.round(performance.now() - startedAt));
    setBusy(true);
    setStatus(sending);
    /** @type {Response | null} */
    let response = null;
    /** @type {ServerPayload | null} */
    let payload = null;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        // Nur Textfelder – wie ohne JavaScript als application/x-www-form-urlencoded
        body: new URLSearchParams(/** @type {any} */ (new FormData(form))),
        credentials: 'same-origin',
        signal: AbortSignal.timeout ? AbortSignal.timeout(TIMEOUT_MS) : undefined,
      });
      payload = await response.json().catch(() => null);
    } catch (err) {
      response = null;
    } finally {
      setBusy(false);
    }

    if (response && response.ok && payload && payload.ok === true) {
      setStatus('');
      form.reset();
      updateLeaveGuard();
      startedAt = null;
      attempted = false;
      form.hidden = true;
      thanks.hidden = false;
      /** @type {HTMLElement | null} */ (thanks.querySelector('.thanks-title'))?.focus();
      if (onSuccess) onSuccess();
      return;
    }

    if (response && response.status === 422 && payload && payload.fields) {
      const mapped = mapServerErrors(payload.fields);
      if (Object.keys(mapped).length) {
        showErrors(mapped);
        return;
      }
    }
    const mailto = fallback ? mailtoFallback(fallback.email, fallback.subject, values()) : null;
    setStatus(response && response.status === 429 ? messages.rate : messages.server, true,
      mailto && fallback ? { href: mailto, label: fallback.label } : null);
  });

  resetBtn?.addEventListener('click', () => {
    thanks.hidden = true;
    form.hidden = false;
    showErrors({}, false);
    setStatus('');
    field('name')?.focus();
    if (onReset) onReset();
  });
}
