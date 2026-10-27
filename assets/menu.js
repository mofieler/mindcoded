// @ts-check
/**
 * mindcoded.studio — Mobilmenü: Dialog mit Fokusfalle, Escape, inertem Hintergrund und einer
 * Punktwolke, die vom Menü-Button aus aufgeht. Schließt sich selbst, sobald der volle Header passt.
 */

import { $, $$, closest, createField, media, motion, root } from './context.js';
import { scrollToTarget } from './smooth-scroll.js';

export function initMenu() {
  const menu = $('#mobile-menu');
  const openBtn = $('#menu-open-btn');
  const closeBtn = $('#menu-close-btn');
  if (!menu || !openBtn || !closeBtn) return;
  const background = /** @type {HTMLElement[]} */ (['.site-header', '#main', '.site-footer', '#mobile-fab'].map(s => $(s)).filter(Boolean));
  /** @type {any} Punktwolke (dotfield.js, noch ohne Typprüfung) */
  let field = null;
  let open = false;

  const focusables = () => $$('a[href], button:not([disabled])', menu).filter(el => el.offsetParent !== null);

  const show = () => {
    if (open) return;
    open = true;
    const b = openBtn.getBoundingClientRect();
    menu.style.setProperty('--menu-x', `${b.left + b.width / 2}px`);
    menu.style.setProperty('--menu-y', `${b.top + b.height / 2}px`);
    menu.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
    openBtn.setAttribute('aria-expanded', 'true');
    background.forEach(el => { el.inert = true; });
    root.classList.add('menu-open');
    closeBtn.focus();

    const cv = $('#menu-canvas');
    if (cv && !field && !motion.paused) {
      field = createField(cv, { manual: true, per: 110, max: 1800, stagger: 0.18, mr: 70, spring: 0.09 });
      field.resize();
      field.burst(b.left + b.width / 2, b.top + b.height / 2);
      field.activate();
    } else if (field && !motion.paused) {
      field.activate();
    }
  };

  /** @param {string | null} [targetHash] */
  const hide = (targetHash = null) => {
    if (!open) return;
    open = false;
    menu.classList.remove('is-open');
    openBtn.setAttribute('aria-expanded', 'false');
    background.forEach(el => { el.inert = false; });
    root.classList.remove('menu-open');
    if (field) field.deactivate();
    const done = () => { if (!open) menu.hidden = true; };
    if (motion.paused) done(); else setTimeout(done, 600);

    const target = targetHash && $(targetHash);
    if (target) {
      scrollToTarget(target);
      const focusTarget = /** @type {HTMLElement} */ (target.querySelector('h1, h2') || target);
      if (!focusTarget.hasAttribute('tabindex')) focusTarget.setAttribute('tabindex', '-1');
      focusTarget.focus({ preventScroll: true });
    } else {
      openBtn.focus();
    }
  };

  openBtn.addEventListener('click', show);
  closeBtn.addEventListener('click', () => hide());
  menu.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      e.preventDefault();
      hide();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = focusables();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  menu.addEventListener('click', e => {
    const link = /** @type {HTMLAnchorElement | null} */ (closest(e, 'a[href]'));
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (href.startsWith('#')) {
      e.preventDefault();
      hide(href);
    } else {
      hide();
    }
  });
  media('header-full').addEventListener('change', e => { if (e.matches) hide(); });
}
