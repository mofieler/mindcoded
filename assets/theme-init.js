// @ts-check
/**
 * mindcoded.studio — läuft synchron im <head>, bevor die Seite gezeichnet wird.
 * 1. Markiert, dass JavaScript aktiv ist (.no-js → .js) – das CSS blendet erst dann
 *    Effekte wie das Scroll-Reveal ein. Ohne JavaScript bleibt alles sichtbar.
 * 2. Übernimmt ein gespeichertes Farbschema ohne Aufblitzen des Standard-Schemas; ohne
 *    eigene Wahl folgt die Seite der Systemeinstellung (content/site.json › defaultTheme).
 * 3. Entscheidet vor dem ersten Zeichnen, ob das Start-Intro läuft (nur Startseite, nur beim
 *    Ankommen von außen, nie bei reduzierter Bewegung). Ohne Browser-Speicher: Neuladen,
 *    Zurück/Vor und Wechsel innerhalb der Website zeigen direkt den Inhalt. Mit »?intro« in
 *    der Adresse läuft es immer – praktisch zum Ansehen.
 * 4. Startet eine Seite nach einem Projektwechsel unter dem Vorhang (siehe unten).
 */
(function () {
  var root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');
  var stored = '';
  try {
    stored = (localStorage.getItem('mc-theme') || '').toLowerCase();
  } catch (e) {
    /* Speicher gesperrt (z. B. privater Modus): Standard-Schema bzw. System gilt. */
  }
  if (stored === 'light' || stored === 'dark') {
    root.setAttribute('data-theme', stored);
  } else if (root.getAttribute('data-theme-default') === 'system' && window.matchMedia) {
    root.setAttribute('data-theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Projektwechsel: Kommt man per Link von einer anderen Seite dieser Website (Case Study bzw.
     zurück zu #projekte), startet die Seite unter dem Vorhang, der sich dann per CSS hebt
     (transitions.js, layout/curtain.css). Nicht bei Neuladen, Zurück/Vor oder Sprachwechsel. */
  var ref = document.referrer || '';
  var nav = /** @type {PerformanceNavigationTiming | undefined} */ (window.performance && performance.getEntriesByType ? performance.getEntriesByType('navigation')[0] : undefined);
  var freshNavigation = !nav || nav.type === 'navigate';
  var fromOwnSite = ref.indexOf(location.origin + '/') === 0;
  var curtainPage = root.getAttribute('data-curtain-page');
  if (curtainPage && !reduced) {
    var lastSegment = function (url) {
      var parts = url.split(/[?#]/)[0].split('/').filter(Boolean);
      return parts[parts.length - 1] || '';
    };
    var fromSite = fromOwnSite && freshNavigation && lastSegment(ref) !== lastSegment(location.href);
    /* Startseite: nur bei Sprung in einen Abschnitt mit eigenem Vorhang (data-curtain-targets) */
    var targets = (root.getAttribute('data-curtain-targets') || '').split(' ');
    var target = location.hash.slice(1);
    var toSection = curtainPage === 'home' && target !== '' && targets.indexOf(target) !== -1;
    if (fromSite && (curtainPage === 'case' || toSection)) {
      if (toSection) root.setAttribute('data-curtain-target', target);
      root.classList.add('curtain-in');
      window.addEventListener('pagereveal', function (e) {
        var vt = /** @type {any} */ (e).viewTransition;
        if (vt) vt.skipTransition();
      });
    }
  }

  var mode = root.getAttribute('data-intro');
  if (!mode || mode === 'off') return;
  if (reduced) return;
  if (location.hash && location.hash !== '#top') return; /* Direkteinstieg in einen Abschnitt */
  var play = mode === 'always' || /[?&]intro\b/.test(location.search);
  if (freshNavigation && !fromOwnSite) play = true;
  if (play) root.classList.add('intro-pending');
})();
