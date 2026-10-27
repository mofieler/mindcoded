// @ts-check
/**
 * mindcoded.studio — Farbschema-Wahl (reine Logik, auch von den Browser-Tests genutzt).
 *
 * Die Seite folgt der Voreinstellung (content/site.json › defaultTheme, meist »system«), bis
 * jemand umschaltet. Schaltet man auf das Schema zurück, das die Voreinstellung ohnehin zeigt,
 * vergisst die Seite die eigene Wahl und folgt wieder dem System – auch wenn es später wechselt.
 * So gibt es den Weg zurück ohne dritten Zustand am Schalter (der bei jedem Klick sichtbar
 * wechseln soll).
 */

/** Schema, das ohne eigene Wahl gilt. */
export function defaultTheme(setting, systemIsDark) {
  if (setting === 'dark' || setting === 'light') return setting;
  return systemIsDark ? 'dark' : 'light';
}

/** Was nach dem Umschalten gespeichert wird: das Schema – oder null, wenn es der Voreinstellung entspricht. */
export function themeToStore(next, fallback) {
  return next === fallback ? null : next;
}
