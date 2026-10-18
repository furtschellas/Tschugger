# Die App in Teilen

Die Grunddatei der App (früher eine Datei mit über 2000 Zeilen) liegt hier in Teilen, in der Reihenfolge der Dateinamen:

| Teil | Inhalt |
|---|---|
| 00-head.html | Kopf (Schriften, Theme vor dem ersten Zeichnen) |
| 01-style.html | Gestaltung (CSS) |
| 02-markup.html | Gerüst der Seite (Kopf, Ansicht, Suche, Hauptmenü) |
| 10-core.js | Texte, Hilfsfunktionen (Datum, Telefonnummer, Fenster mkDialog, Knöpfe), Karten-Links, Anzeige-Optionen |
| 11-schedule-prep.js | Drehtage, Units, Tagesleiste, Prep |
| 12-mycal.js | Meine Termine |
| 13-crew-views.js | vCard, Crewliste, Locations, Callsheet und weitere Seiten |
| 14-render.js | Seite zeichnen |
| 15-script-tab.js | Drehbuch-Seite |
| 16-interaction.js | Klicks |
| 17-scene-reader.js | Szene aus dem Drehbuch lesen |
| 18-blocking.js | Blocking-Galerie |
| 19-search.js | Suche |
| 20-data-start.js | Daten (Prüfung, Zwischenspeicher) und Start |
| 99-tail.html | Ende |

`python3 tools/make_site.py` setzt die Teile zu `tools/app.html` zusammen und baut daraus mit `tools/boot/*.js` die Website.
Jeder `.js`-Teil muss für sich gültiges JavaScript sein (der Test «App-Teile ohne Syntaxfehler» prüft das).
