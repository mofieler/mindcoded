# 0007 – Sanftes Scrollen nach dem Lenis-Prinzip, ohne Fremdbibliothek

- **Status:** vorgeschlagen
- **Datum:** 2026-10-20
- **Beteiligte:** Betreiber (Wunsch: Scrollen soll sich sanfter und eleganter anfühlen), Entwicklung

## Kontext

Mit dem Mausrad springt die Seite unter Windows in groben Schritten (meist 100 px je Raste).
Die scrollgebundenen Effekte (Parallax im Hero, Lesefortschritt, Einblenden) springen dann mit.
Agentur-Websites lösen das meist mit Lenis (darkroom.engineering, MIT): Lenis lässt die Seite
nativ scrollen und gleicht nur die Radschritte über einige Frames aus. Gefragt war, ob Lenis zum
Ansatz dieser Website passt: Python-Build ohne Node.js, ES-Module ohne Bundler, alle Dateien
selbst gehostet, Progressive Enhancement, Bewegung abschaltbar (WCAG 2.2.2).

## Entscheidungstreiber

- Spürbar weicheres Scrollen mit Mausrad und bei Sprüngen zu Abschnitten
- Nichts darf kaputtgehen: Sticky, IntersectionObserver, Tastatur, Scrollleiste, Suche im Text, Touch
- Barrierefreiheit: Systemeinstellung »Bewegung reduzieren« und der Schalter im Footer gelten
- Leistung: Die Hero-Animation belastet den Hauptthread, Scrollen darf dadurch nicht ruckeln
- Keine Abhängigkeit, die ohne npm von Hand aktualisiert werden müsste

## Optionen

1. **Nichts tun** – native Radschritte; `scroll-behavior: smooth` nur für Ankerlinks.
2. **Lenis einbinden** – als ESM-Datei unter `assets/vendor/` abgelegt, rund 5 KB komprimiert.
   Ausgereift. Muss aber von Hand heruntergeladen und aktualisiert werden: Downloads aus der Shell
   sind auf dem Arbeitsrechner gesperrt. Kann viel mehr, als hier gebraucht wird (Touch-Glättung,
   horizontales Scrollen, eigene Scroll-Container).
3. **Eigenes Modul nach dem Lenis-Prinzip** – rund 150 Zeilen in `assets/smooth-scroll.js`. Es
   glättet nur das Rad und gleitet bei Sprüngen zu Abschnitten; alles andere bleibt nativ.

## Entscheidung

Gewählt: Option 3, weil sie die Wirkung von Lenis für die zwei Fälle bringt, die hier zählen. Das
Modul folgt dem Prinzip von Lenis (natives Scrollen, nur Radschritte glätten), hat keine
Abhängigkeit und passt zu den Regeln des Projekts (Pause, Leistungsstufen, Tests im Browser).

- **Rad:** Jede Raste setzt ein Ziel. Die Seite holt es mit einem bildratenunabhängigen Lerp auf;
  der Faktor ist 0,1 je Frame bei 60 Hz, bei 120 Hz wirkt er gleich.
- **Sprünge:** Ankerlinks, Menü und Logo gleiten mit einer expo-out-Kurve in 0,6–1,4 s ans Ziel.
  `scroll-padding-top`, Fokus und Adresse folgen wie beim nativen Sprung.
- **Aus bleibt es:**
  - bei reduzierter Bewegung und im Pausenzustand
  - auf Geräten ohne feinen Zeiger (Touch)
  - sobald `perf.js` die Qualität gesenkt hat
  - bei Strg/⌘ + Rad
  - über eigenen Scrollbereichen und bei offenem Menü
- **Unterbrechung:** Scrollleiste, Tastatur, Touch oder Klick unterbrechen sofort.

## Konsequenzen

- **Gut:** Weiches Scrollen, und die Scroll-Effekte laufen flüssig mit, weil die Position in jedem
  Frame wandert.
- **Gut:** Sticky, Observer, Tastatur und Scrollleiste bleiben nativ.
- **Gut:** Keine fremde Datei, die von Hand aktualisiert werden müsste.
- **Schlecht:** Radschritte laufen über den Hauptthread statt über den Compositor. Bei hoher Last
  (Punktwolken) könnte das Scrollen stocken. Abhilfe: Sobald `perf.js` die Qualität senkt, ist die
  Glättung aus.
- **Schlecht:** Auf Touchpads mit eigenem Schwung kann die Glättung etwas träge wirken. Der Faktor
  `LERP` steht oben im Modul und lässt sich nachstellen.
- **Restrisiko:** Eigener Code statt bewährter Bibliothek. Die Randfälle (Zoom, verschachtelte
  Scrollbereiche, Unterbrechung) sind abgedeckt, die Rechenfunktionen haben Browser-Tests. Treten
  weitere Fälle auf, ist Lenis ohne Umbau einsetzbar: gleiche Grundidee, gleiche Einbindung.
