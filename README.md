# Tschugger Tigerblood – Crew-App

Website-Version der Crew-App (Drehplan, Callsheet, Locations, Crew, Infos) für den Dreh im Wallis.

- `index.html` – die App (gebaut aus `tools/app.html` mit `tools/make_site.py`)
- Anmeldung mit E-Mail und Passwort über Firebase Authentication. Nur eingeladene Adressen können beitreten; der Admin verwaltet Einladungen und Sperren in der App (Konto → Benutzer verwalten).
- `data.enc.json` – die Crew-Daten, verschlüsselt (AES-GCM). Den Schlüssel bekommen nur angemeldete, freigeschaltete Mitglieder aus Firestore.
- `firestore.rules` – die Zugriffsregeln für Firestore.
- `tools/publish.py` – verschlüsselt einen Daten-Export neu; wird von der stündlichen Aktualisierung aufgerufen.
