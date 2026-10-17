# Tests

`python3 tests/smoke.py` – startet die gebaute `index.html` mit einer nachgebauten Firebase (`tests/fake/`)
und den echten, verschlüsselten Daten, meldet sich mit sechs Rollen an (Owner, Admin, Crew, Catering,
Power, ohne Rolle) und prüft die wichtigsten Seiten und Bedienelemente auf Handy- und Desktop-Breite.

- Schlüssel: Dienstkonto (`FIREBASE_SA`) oder `CREW_KEY` als Umgebungsvariable.
- Ausgabe nur ✓/✗ – nie Inhalte der Crew-Daten (das Protokoll bei GitHub ist öffentlich).
- Läuft bei GitHub automatisch vor jeder Veröffentlichung von Code (`.github/workflows/pages.yml`).
- Neue Funktion → hier eine Prüfung ergänzen (`check("Name", Bedingung, Info)`).
