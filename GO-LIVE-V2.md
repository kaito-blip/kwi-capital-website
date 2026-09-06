# Go-Live V2.0 — Anleitung

**Status:** V2.0 ist fertig, getestet und wartet auf das Ende des Non-Compete.
Bis dahin läuft sie als Parallel-Version unter `kwicapital.ch/index-v2.html`
(`noindex`, nirgends verlinkt — für Suchmaschinen unsichtbar, V1 bleibt die Hauptseite).

**Gemessene Werte (Lighthouse, 06.09.2026):**
Mobile 98–99 / 100 / 100 · Desktop 99 / 100 / 100 · LCP 1.3 s mobil, 0.4 s Desktop · CLS 0.
SEO zeigt im Parallel-Betrieb 66 — das ist NUR das absichtliche `noindex` (siehe Schritt 3).

## Promotion (V2 → Hauptseite)

1. `git mv index.html index-v1-archiv.html` — V1 sichern
2. `cp index-v2.html index.html` — V2 wird Hauptseite (index-v2.html darf bleiben oder weg)
3. **Im neuen `index.html`:**
   - `<meta name="robots" content="noindex,follow">` → `content="index,follow"`
   - Canonical ergänzen: `<link rel="canonical" href="https://kwicapital.ch/">`
   - (Der Kommentar im `<head>` markiert genau diese Stelle.)
4. Falls `index-v1-archiv.html` deployed bleibt: dort `noindex` ins `<head>` setzen
5. `sitemap.xml`: `lastmod` der Startseite aktualisieren
6. Push — **Achtung Konto:** Repo gehört `kaito-blip`:
   ```bash
   gh auth switch -u kaito-blip && git push origin main && gh auth switch -u kaitoweingart-maker
   ```
7. Nach ~2 Min. Deploy prüfen: `https://kwicapital.ch/` zeigt V2, `curl -s https://kwicapital.ch/ | grep robots` zeigt `index,follow`

**Rollback:** Schritte umkehren (`git mv index-v1-archiv.html index.html`).

## Fixer Snapshot

Git-Tag **`v2.0`** = exakt dieser geprüfte Stand. Wiederherstellen jederzeit mit:
```bash
git checkout v2.0 -- index-v2.html assets/js/kwi-analytics.js
```

## Nach dem Go-Live (optional, in dieser Reihenfolge sinnvoll)

- **`/en/`-Version + hreflang** (EN-Texte liegen fertig im i18n-Dict von index.html)
- **Formular → eigener Backend-Endpoint** (Render) statt mailto
- **Cloudflare vor GitHub Pages** → Cache-Header (letzter Lighthouse-Punkt)
- **admin.html vom Public-Deploy nehmen** (Editor funktioniert lokal identisch)
- Google Search Console: Sitemap einreichen
