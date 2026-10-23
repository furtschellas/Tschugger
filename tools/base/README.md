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
| 13a-callsheet.js | Callsheet 1/6: Grundlagen (Klicks, Symbole, Text mit Telefon/Links, Tabellen, Fahrt-Zelle, «ich» im Callsheet) |
| 13b-cs-now.js | Callsheet 2/6: «Jetzt» (laufende Zeile und Szene, Ort jetzt, Orte in der Nähe; Zürcher Zeit) |
| 13c-cs-places.js | Callsheet 3/6: Orte (Arten, Codes, Locations, Adressen, Drehfolge) |
| 13d-cs-mine.js | Callsheet 4/6: Mein Drehtag (Abteilung, offen für mich, Kacheln, Sprungleiste, Summen) |
| 13e-cs-sections.js | Callsheet 5/6: Abschnitte (Locations, Karte, Anreise, Calls) und renderCS |
| 13f-cs-events.js | Callsheet 6/6: nach dem Zeichnen (Suche, «Nur meins», Vorschau, Cast-Ansicht, Karte, Cast jetzt) |
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
