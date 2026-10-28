// @ts-check
/**
 * mindcoded.studio — Video mit Zwei-Klick-Lösung (Datenschutz).
 *
 * Auf der Seite steht nur ein Vorschaubild vom eigenen Server; bis zum Klick geht keine Anfrage an
 * YouTube. Erst der Klick auf »Abspielen« setzt den Player von youtube-nocookie.com ein und startet
 * ihn. Ohne JavaScript – oder mit Zusatztaste – öffnet der Link das Video auf YouTube.
 * Markup: blocks.py › case_video · Gestaltung: components/video-embed.css
 */

const PLAYER = 'https://www.youtube-nocookie.com/embed/';

/**
 * Player-Adresse für eine Video-ID (nur gültige IDs, sonst null).
 * @param {string} id
 */
export function playerUrl(id) {
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
  return `${PLAYER}${id}?autoplay=1&rel=0&playsinline=1`;
}

export function initVideo() {
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const play = target?.closest('[data-video-play]');
    const embed = play?.closest('[data-video]');
    if (!(embed instanceof HTMLElement) || event.defaultPrevented) return;
    if (/** @type {MouseEvent} */ (event).button !== 0 || /** @type {MouseEvent} */ (event).metaKey
      || /** @type {MouseEvent} */ (event).ctrlKey || /** @type {MouseEvent} */ (event).shiftKey) return;
    const src = playerUrl(embed.dataset.video || '');
    if (!src) return;
    event.preventDefault();
    const frame = document.createElement('iframe');
    frame.className = 'video-embed-frame';
    frame.src = src;
    frame.title = embed.dataset.videoTitle || 'YouTube';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    embed.replaceChildren(frame);
    embed.classList.add('is-playing');
    frame.focus();
  });
}
