# Kuroiwa — KWI Capital AG · Website + Studio

BlackRock-inspirierte, editoriale Website für die KWI Capital AG (Deckname **Kuroiwa / 黒岩**),
mit einem eingebauten Back-End-Tool zum Erstellen von **Studien**.

## Struktur
```
index.html        Startseite (Hero, Fokus, Philosophie, Zahlen, Studien-Vorschau, Kontakt)
studien.html      Alle Studien mit Kategorie-Filter
study.html        Einzelne Studie (study.html?id=…)
admin.html        „Kuroiwa Studio“ — Back-End zum Erstellen/Bearbeiten von Studien
data/studies.json Publizierte Studien (das ist die „Datenbank“ der Website)
assets/css/style.css
assets/js/site.js   (Front-End: lädt & rendert Studien)
assets/js/admin.js  (Back-End-Logik)
```

## So erstellst du eine Studie
1. Öffne **`admin.html`** → Zugangscode **`kuroiwa`**.
2. Titel, Kategorie, Datum, Zusammenfassung und Inhalt ausfüllen. Der Inhalt ist HTML —
   markiere Text und nutze die Buttons (H2, Absatz, Fett, Zitat, Liste, Link, Bild).
   Rechts siehst du eine **Live-Vorschau**.
3. **Speichern** → die Studie liegt lokal in deinem Browser.
4. Zum **Veröffentlichen**: Button **„studies.json exportieren“** → die heruntergeladene
   Datei ersetzt `data/studies.json` im Repo → committen & pushen. Fertig, live.

> Der Zugangscode ist nur ein leichter Riegel (Client-seitig), **keine echte Sicherheit**.
> Publiziert wird ausschliesslich über das Committen von `studies.json` — das kannst nur du.

## Lokal ansehen
Wegen Browser-Sicherheit lädt `studies.json` nicht über `file://`. Kurz einen Mini-Server starten:
```
cd kwi-capital-website
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

## Deployen (GitHub Pages)
1. Repo anlegen, Inhalt pushen.
2. Settings → Pages → Branch `main`, Ordner `/root` → Save.
3. Optional eigene Domain (z. B. `kwicapital.ch`) via CNAME verbinden.

## Design-Tokens
- Tinte `#0b0b0c` · Papier `#f6f5f2` · Akzent-Rot (Kuroiwa) `#c0271f`
- Display-Serif **Fraunces**, Text-Sans **Inter**
- Markenmotiv: Wortmarke **KW​I** (rotes „I“) + Kanji **黒岩** (schwarzer Fels)
