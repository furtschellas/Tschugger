# Website-Teil der Crew-App (früher tools/web_boot.js)

Die Dateien werden von `tools/make_site.py` in Namensreihenfolge **ohne Trennzeichen** aneinandergehängt
und zusammen mit `tools/app.html` (Claude-App) zu `index.html` gebaut. Es ist also ein einziges Skript:
alles teilt denselben globalen Bereich, die Reihenfolge zählt (Nummern vorne).

| Datei | Inhalt |
|---|---|
| 01-config | Firebase-Version, Besitzer, Datendatei, Abfrage-Takt |
| 02-i18n | Übersetzungen (fr/it/en) der Website-Texte |
| 03-core-firebase | Sprachen, Berechtigungen (PERMS), Rollen, Firebase laden |
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

Neue Teile: eigene Datei mit passender Nummer anlegen (z. B. `13b-…`), dann `python3 tools/make_site.py`.
