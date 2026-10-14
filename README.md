# Tschugger Tigerblood – Crew-App

Website-Version der Crew-App (Drehplan, Callsheet, Locations, Crew, Infos) für den Dreh im Wallis.

- `index.html` – die App (wird aus `tools/app.html` mit `tools/make_site.py` gebaut)
- `data.enc.json` – die Crew-Daten, verschlüsselt (AES-GCM, Schlüssel aus dem Crew-Passwort). Ohne Passwort nicht lesbar.
- `tools/publish.py` – verschlüsselt einen Daten-Export neu; wird von der stündlichen Aktualisierung aufgerufen.

Das Crew-Passwort steht nicht in diesem Repository.
