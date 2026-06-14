# Plan Electron — StroyGetter Desktop

> Web reste la priorité. Ce plan est à implémenter plus tard.

**Objectif :** Proposer un installeur natif (.exe / .dmg / AppImage) permettant aux utilisateurs de lancer StroyGetter sans Docker ni serveur.

**Pourquoi Electron plutôt que Tauri :** La doc officielle Tauri Next.js exige `output: 'export'` (static only), incompatible avec les API routes. Le pattern "Node sidecar Tauri" existe mais ajoute de la complexité sans bénéfice réel ici — Electron inclut Node.js nativement, ce qui simplifie le lifecycle des processus.

---

## Points de départ favorables (déjà en place)

- `next.config.ts` a déjà `output: "standalone"` ✓
- `ffmpeg-static` bundle ffmpeg par plateforme ✓
- `selectYtDlpPath()` cherche déjà dans `.next/server/bin/` ✓
- `copy-binaries.js` copie yt-dlp dans `.next/server/bin/` au postbuild ✓

---

## Phase 1 — Setup Electron (1 jour)

Créer un workspace `electron/` séparé avec sa propre `package.json`.
Dépendances : `electron`, `electron-builder`.

---

## Phase 2 — Main process (2-3 jours)

`electron/main.ts` doit :

1. Trouver un port libre dynamiquement
2. Spawner `node .next/standalone/server.js --port PORT` via `process.execPath` (Node.js intégré à Electron — pas besoin de le bundler séparément)
3. Poller `http://localhost:PORT` jusqu'à ce que Next.js réponde (~2-4s)
4. Ouvrir `BrowserWindow` sur `http://localhost:PORT`
5. Sur `app.quit` : kill proprement le child process (SIGTERM → timeout → SIGKILL)

---

## Phase 3 — Corriger le PARENT_PATH (1 jour)

**Problème :** `lib/serverUtils.ts:16` hardcode `/temp/stroygetter` en production — inutilisable sur Windows desktop et macOS sans droits root.

**Fix :** Ajouter support d'une variable `ELECTRON_USER_DATA` passée par le main process via les env vars du child process, pointant vers `app.getPath('userData')`.

---

## Phase 4 — Binary bundling (1-2 jours)

| Binaire | Situation actuelle | Action |
|---|---|---|
| ffmpeg | `ffmpeg-static` déjà inclus ✓ | Rien |
| yt-dlp | `copy-binaries.js` le copie ✓ | S'assurer qu'electron-builder l'inclut |
| gallery-dl | Binaire Python, résolu via PATH | MVP : message d'erreur clair si absent (`pip install gallery-dl`) |

---

## Phase 5 — electron-builder config (2-3 jours)

`electron-builder.yml` pour packager :
- `.next/standalone/` + `.next/static/` + `public/`
- Cibles : `nsis` (Windows), `dmg` (macOS), `AppImage` (Linux)

Bundle estimé : ~300 MB (Chromium ~180 MB + Next.js standalone ~80 MB + binaires ~40 MB)

---

## Phase 6 — UX minimale (1 jour)

- Splash screen pendant le boot Next.js
- Comportement natif correct (macOS : ne quitte pas sur fermeture de fenêtre ; Windows : quit normal)

---

## Phase 7 — CI/CD multi-plateforme (2-3 jours)

GitHub Actions en parallèle sur `ubuntu-latest`, `windows-latest`, `macos-latest`.
Publish vers GitHub Releases. `electron-updater` pour auto-update.

---

## Estimation

| Scope | Durée |
|---|---|
| MVP fonctionnel (Windows uniquement) | ~8 jours |
| MVP multi-plateforme | ~12 jours |
| Avec CI/CD et auto-update | ~15 jours |

La complexité principale est la Phase 7 (CI multi-plateforme) et la gestion propre des processus enfants à la fermeture de l'app.
