# Manuelle Prüfung – Geräte, Browser, Screenreader

Stand: 19.10.2026. Die automatischen Tests (`python tools/check.py`) laufen in Microsoft Edge.
Was dort nicht prüfbar ist, steht hier: andere Browser, echte Geräte und Screenreader. Einmal vor
dem Livegang durchgehen, danach bei größeren Änderungen. Die Ergebnisse fließen in die
[Erklärung zur Barrierefreiheit](../content/de.json) (`legal › accessibility`) ein.

**Wo prüfen:** auf dem Webspace nach dem Upload, solange die Adresse noch nicht verbreitet ist.
Alternativ lokal: `python tools/serve.py --watch --lan` – der Server nennt die Adresse, die das
Handy im selben WLAN aufruft. Windows fragt beim ersten Mal nach der Firewall-Freigabe; im
Firmennetz kann das gesperrt sein, dann auf dem Webspace prüfen. Das Formular antwortet lokal
nur zum Schein (es wird nichts versendet).

**Befunde** mit IDs festhalten (`M-01`, `M-02` …), ohne Personennamen.

## 1. Geräte und Browser

| ID | Gerät / Browser | Warum |
|---|---|---|
| G1 | iPhone, Safari (aktuelles iOS) | etwa jedes dritte Handy in Deutschland; eigene Engine |
| G2 | Android-Mittelklasse, Chrome | prüft die Leistungsanpassung der Animationen |
| G3 | iPad, Safari, hoch und quer | Tablet-Layouts |
| G4 | Desktop, Firefox | eigene Engine |
| G5 | Mac, Safari | eigene Engine, Trackpad |

Je Gerät:

- [ ] Startseite lädt ohne Ruckeln; Intro erscheint einmal und lässt sich durch Tippen beenden
- [ ] Hero-Animation flüssig; auf G2 nach einigen Sekunden ggf. weniger Punkte (gewollt)
- [ ] Beschriftungen »Identity · Architecture · Code« stoßen nicht aneinander
- [ ] Header verschwindet beim Herunterscrollen und erscheint beim Hochscrollen; nichts verdeckt
- [ ] Mobilmenü öffnet und schließt (auch mit Zurück-Geste); Seite scrollt dahinter nicht
- [ ] Leistungen aufklappen; in der Animation wischen (Handy)
- [ ] »Dazu anfragen« springt zum Formular und hakt das Thema an
- [ ] Formular ausfüllen, dann Seite neu laden → Rückfrage erscheint; über den Datenschutz-Link
      hin und mit »Zurück« wieder zurück → Eingaben sind noch da (keine Rückfrage)
- [ ] Testanfrage senden (nur auf dem Webspace) → Dankeskarte; Mail kommt an, nicht im Spam
- [ ] Farbschema umschalten; zurückschalten → folgt wieder dem System (System-Dunkelmodus
      umstellen: Seite wechselt mit)
- [ ] »Animationen anhalten« im Footer stoppt alle Animationen; erneut tippen startet sie
- [ ] Systemeinstellung »Bewegung reduzieren« an → alles ruhig, Inhalte sofort sichtbar
- [ ] Textgröße des Systems vergrößert / Browser-Zoom 200 % → nichts abgeschnitten oder überlappend
- [ ] Querformat (Handy) → Hero und Menü bedienbar
- [ ] Case Study und Leistungsseite (sobald veröffentlicht): Übergang, Zurück-Link, Leiste unter dem Header

## 2. Nur Tastatur (Desktop)

- [ ] Erster Tab-Schritt zeigt »Zum Inhalt springen«; Enter springt zum Hauptinhalt
- [ ] Fokusrahmen immer sichtbar, auch auf dunklem Grund (Kontakt, Footer)
- [ ] Akkordeons mit Enter/Leertaste; zugeklappte Inhalte werden übersprungen
- [ ] Mobilmenü (schmales Fenster): Fokus bleibt im Menü, Escape schließt, Fokus kehrt zum Button zurück
- [ ] Formular vollständig per Tastatur; Fehler führen den Fokus zum ersten fehlerhaften Feld

## 3. Screenreader

| ID | Kombination |
|---|---|
| S1 | NVDA (kostenlos) mit Firefox oder Chrome unter Windows |
| S2 | VoiceOver mit Safari auf dem iPhone |
| S3 | VoiceOver mit Safari auf dem Mac (optional) |

- [ ] Überschriftenliste (NVDA: Taste H / Elementliste) ist logisch: eine H1, dann Abschnitte
- [ ] Bereiche werden angesagt: Banner, Navigation, Hauptinhalt, Fußbereich
- [ ] H1 des Hero wird vollständig vorgelesen, nicht buchstabenweise (Schreibmaschinen-Effekt)
- [ ] Animationen werden nicht vorgelesen; bei jeder Leistung werden die vier Schritte als Liste vorgelesen
- [ ] Akkordeon: Zustand »erweitert/reduziert« wird angesagt
- [ ] Menü: wird als Dialog angesagt; Schließen-Button hat einen Namen
- [ ] Formular: jede Beschriftung, Pflichtangabe und Fehlermeldung wird angesagt; »Wird gesendet …«
      und die Dankesmeldung werden vorgelesen
- [ ] Englische Seiten werden in englischer Aussprache gelesen, Sprachwechsel-Links korrekt
- [ ] Footer: »Animationen anhalten« wird als Umschalter mit Zustand angesagt

## 4. Ergebnis festhalten

| Datum | Gerät/Kombination | Ergebnis | Befunde |
|---|---|---|---|
| | | | |

Danach:
1. Befunde beheben oder in der Erklärung unter »Bekannte Einschränkungen« nennen.
2. Erklärung zur Barrierefreiheit ausfüllen (alle `TODO:`), `draft` auf `false` setzen.
