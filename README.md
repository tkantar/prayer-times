# Hidaya e.V. — Gebetszeiten Essen

Statische React-Webseite, die taegliche Gebetszeiten fuer Essen anzeigt.
Die Berechnung passiert vollstaendig im Browser (Library: `adhan`), es ist
keine API noetig.

## Lokale Entwicklung

```bash
npm install
npm run dev
```

Die Seite ist dann unter http://localhost:5173/prayer-times/ erreichbar.

## Konfiguration (`src/config.js`)

Alle haendisch anpassbaren Werte stehen in `src/config.js`:

- `LOCATION` — Koordinaten und Zeitzone (Default: Essen)
- `BUFFERS` — Pufferminuten fuer Dhuhr und Maghrib (Default: je 3 Min.)
- `CALCULATION` — Fajr-/Isha-Winkel (Default: 18° / 17°)
- `MESSAGES` — Nachrichten/Ankuendigungen, die unter den Gebetszeiten erscheinen
- `ORG` — Vereinsname und Untertitel
- `PRAYER_DISPLAY` — Reihenfolge & Beschriftung der Gebete

Isha wird automatisch als `min(17°, Sonnenuntergang + 1/3 der Nacht)`
berechnet. Fajr nutzt astronomische Mitternacht als Fallback, falls 18°
in Sommernaechten nicht eintritt.

## Deployment auf GitHub Pages

### Variante A — automatisch via GitHub Actions (empfohlen)

Bei jedem Push auf `main` baut der Workflow
`.github/workflows/deploy.yml` die Seite und deployt sie auf Pages.

**Einmalig in den Repo-Settings einrichten:**
1. Settings → Pages
2. **Source**: *GitHub Actions*

Nach dem ersten erfolgreichen Run ist die Seite unter
`https://<user>.github.io/prayer-times/` erreichbar.

### Variante B — manuell via `npm run deploy`

```bash
npm run deploy
```

Pusht den `dist/`-Ordner auf den `gh-pages`-Branch. In den Repo-Settings
muss dann der Branch `gh-pages` als Pages-Source ausgewaehlt sein.

## Repo-Name aendern

Falls das GitHub-Repo nicht `prayer-times` heisst, in `vite.config.js`
die Konstante `REPO_NAME` anpassen. Sie steuert den `base`-Pfad und muss
zum Repo-Namen passen.

## Struktur

```
src/
  App.jsx              # UI
  App.css              # Layout / Styling
  config.js            # ALLE haendisch anpassbaren Werte
  lib/
    prayerTimes.js     # Gebetszeit-Berechnung
    hijri.js           # Hijri-Datum (Intl.DateTimeFormat)
public/
  logo.jpeg            # Hidaya e.V. Logo
.github/workflows/
  deploy.yml           # GitHub Pages Auto-Deployment
```
