# MagicWrite als App auf iPad & Android installieren

Deine App bleibt genau das, was sie war: **eine einzige `index.html`-Datei ohne
Backend.** Es sind nur 3 kleine Zusatzdateien dazugekommen, die dafür sorgen,
dass sich die Seite wie eine echte App installieren lässt:

```
magicwrite-app/
├── index.html        ← deine App (mit ein paar zusätzlichen <head>-Zeilen)
├── manifest.json      ← App-Name, Icon, Startbildschirm-Verhalten
├── sw.js               ← Service Worker (merkt sich die App fürs Offline-Starten)
└── icons/              ← App-Icons in allen benötigten Größen
```

## 1. Auf GitHub hochladen

Lade alle Dateien in diesem Ordner (`index.html`, `manifest.json`, `sw.js`,
`icons/`) **im selben Verzeichnis** in dein GitHub-Repository hoch — genau
dort, wo aktuell deine `index.html` liegt. Die Pfade in den Dateien sind
relativ (`./manifest.json`, `./icons/...`), es spielt also keine Rolle, ob dein
Repo unter `username.github.io` oder `username.github.io/reponame` läuft.

Falls du GitHub Pages noch nicht aktiviert hast: Repo-Einstellungen → **Pages**
→ als Quelle den Branch wählen, in dem die Dateien liegen.

## 2. Auf dem iPad installieren (Safari)

1. Öffne die GitHub-Pages-URL deiner App in **Safari** (wichtig: nicht Chrome —
   auf iOS unterstützt nur Safari "Zum Home-Bildschirm").
2. Tippe auf das Teilen-Symbol.
3. Wähle **"Zum Home-Bildschirm"**.
4. Fertig — die App startet jetzt im Vollbild ohne Browserleiste, mit eigenem
   Icon, genau wie eine native App.

## 3. Auf Android installieren (Chrome)

1. Öffne die URL in **Chrome**.
2. Tippe rechts oben auf die drei Punkte → **"App installieren"** (oder
   "Zum Startbildschirm hinzufügen").
3. Fertig.

## Was sich technisch geändert hat

- **`manifest.json`**: sagt dem Betriebssystem, wie die App heißen soll,
  welches Icon sie hat und dass sie im Vollbild (`standalone`) statt im
  Browser laufen soll.
- **`sw.js`** (Service Worker): merkt sich `index.html`, `manifest.json` und
  die Icons im Cache, damit die App auch bei kurzzeitig fehlendem Internet
  sofort startet. Firebase-Anfragen (Login, Datenbank) werden **nicht**
  gecacht, damit Login und Sync immer live bleiben.
- **`<head>`**: ein paar zusätzliche Meta-Tags (Icon, Statusleisten-Farbe,
  "installierbar"-Hinweis für iOS/Android). Am Funktionsverhalten der App
  selbst wurde nichts verändert.

## Wenn du die App später aktualisierst

Wenn du `index.html` änderst, erhöhe in `sw.js` die Zeile
`const CACHE_VERSION = 'magicwrite-v1';` auf z.B. `'magicwrite-v2'`. Sonst
liefert der Service Worker bereits installierten Nutzern weiter die alte
zwischengespeicherte Version aus.
