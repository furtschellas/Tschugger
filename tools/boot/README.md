# Website-Teil der Crew-App (früher tools/web_boot.js)

Jede Datei ist ein **ES-Modul**: oben `import {…} from "…"` (was sie von anderen Teilen braucht), `export` vor dem,
was andere Teile brauchen. `tools/modlink.mjs` (aufgerufen von `tools/make_site.py`) prüft beim Bauen jeden Import
(gibt es den Namen in der genannten Datei?) und dass kein Name doppelt vorkommt, und setzt die Teile **in der Reihenfolge
der Dateinamen** zu einem Skript zusammen (Grundteil `tools/base` zuerst). Jeder Start-Schritt läuft dabei in einem eigenen
try/catch: ein Fehler stoppt nur diesen Schritt, nicht die App.

- Variablen eines anderen Teils nur über dessen Setter ändern (z. B. `setME(…)`), nie direkt.
- In jede Zeichnung einhängen: `onRender(fn)` (vorher) / `onRendered(fn)` (nachher); gespeicherte Einstellungen: `onStore(fn)`.
- Die App-Verwaltung (12b–12e) ist ein eigenes Bündel `admin.js`, geladen beim Öffnen; sie und die Tests erreichen die Namen
  der Seite über `window` (nur die Namen, die sie brauchen). `window.L` ist die Kartenbibliothek, die Übersetzung heisst dort `__L`.

| Datei | Inhalt |
|---|---|
| 01-config | Datums-Formate (fmtDT, fmtD, fmtT), Firebase-Version, Besitzer, Datendatei, Abfrage-Takt |
| 02-i18n | Übersetzungen (fr/it/en) der Website-Texte |
| 03-core-firebase | Sprachen, Berechtigungen (PERMS), Rollen, Firebase laden, Verschlüsselung mit dem Crew-Schlüssel (ownEnc/ownDec) |
| 04-data | verschlüsselte Datendatei, stamp.json, Schlüssel |
| 05-membership-signin | Mitgliedschaft, Anmeldung, Zugangsanfragen |
| 06-prefs-docs | Ansichts-Einstellungen, Dokumente/Mails |
| 07-push | Push-Erinnerungen, VAPID, Status |
| 08-chat-tour | Chat-Assistent, Einführungstour |
| 09-broadcast | Push-Nachricht an alle |
| 10-menus-welcome-presence | Menüs/Catering, Willkommen, «zuletzt gesehen» |
| 11-account | Mein Konto |
| 12-admin | App-Verwaltung, Benutzer, Backup |
| 13-start | Versionsprüfung, Start, Abfrage-Takt |
| 14-today-changes-offline | Änderungen seit dem letzten Besuch, offline am Set |
| 15-weather | Wetter (Open-Meteo) |
| 16-today-view | Seite «Today» |
| 17-audit-misc | Protokoll und Rest |
| 24-flow | Ablauf: Fahrten und Cast auf einer Ebene – Quittierungen speichern, Fahrten in drei Schritten, Cast-Regeln, Kostüm/Maske in Meine Termine |

Neue Teile: eigene Datei mit passender Nummer anlegen (z. B. `13b-…`), dann `python3 tools/make_site.py`.
