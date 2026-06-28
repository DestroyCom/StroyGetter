# Context : stroygetter-native

> Ce document est destiné à être copié dans `stroygetter-native/CLAUDE.md`.
> Il donne à une session Claude Code le contexte complet du projet sans avoir accès au repo web.

---

## Qu'est-ce que ce projet ?

`stroygetter-native` est une application desktop/mobile **Tauri v2** basée sur StroyGetter, le
downloader web (YouTube + TikTok) disponible sur [stroygetter.stroyco.eu](https://stroygetter.stroyco.eu).

L'objectif : permettre aux utilisateurs de télécharger des vidéos **sans dépendre du serveur**,
via un installeur natif Windows / macOS / Android.

---

## Stack décidée (ne pas remettre en question)

| Couche | Choix | Raison |
|---|---|---|
| Shell natif | **Tauri v2** | WebView OS → bundle ~20 MB vs 300 MB Electron |
| Backend | **Rust** (src-tauri) | Inclus dans Tauri, typé, compile ou crash |
| Frontend | **React + Vite** | Réutilise les composants du projet web |
| UI | **shadcn/ui + Tailwind** | Déjà copiés depuis le web — design identique |
| DB | **SQLite via rusqlite** | Cache local des fichiers téléchargés |
| i18n | **4 locales** (en/fr/es/pt) | Fichiers `messages/` déjà copiés |

---

## MVP 1 — scope figé

- YouTube : vidéo (multi-qualité) + audio seul
- TikTok : vidéo (avec et sans watermark) + audio
- Cache local SQLite (éviter de re-télécharger)
- Plateformes : Windows, macOS, Android

**Exclus du MVP 1 :**
- TikTok photos (gallery-dl n'a pas de binaire Android)
- Twitch
- Auto-update

---

## Fichiers déjà présents (copiés depuis le web)

```
components/ui/       → composants shadcn (accordion, progress, select, separator, skeleton)
components/custom/   → composants métier du web
messages/            → i18n (en.json, fr-FR.json, es-419.json, pt-BR.json)
components.json      → config shadcn
globals.css          → variables CSS Tailwind (couleurs, dark mode, radius)
schema.prisma        → schéma DB de référence (adapter pour rusqlite)
```

---

## Architecture Tauri : comment ça fonctionne

```
Frontend (React/Vite)
  └─ invoke("get_video_info", { url })   ← Tauri IPC
       └─ src-tauri/src/commands/metadata.rs
            └─ spawn yt-dlp --dump-json {url}
            └─ retourne VideoInfo struct → sérialisé JSON → frontend
```

Chaque action utilisateur (fetch info, download, etc.) passe par un **Tauri command** en Rust.
Le frontend ne fait que de l'affichage et des appels `invoke()`.

---

## Logique métier à porter depuis le web

### 1. Validation d'URL

Source : `lib/serverUtils.ts` du web. Patterns exacts à reproduire en Rust :

```
YouTube  : https://... (youtube.com/watch?v=, youtu.be/, /shorts/, /embed/, /live/)
TikTok   : https://www.tiktok.com/@user/(video|photo)/ID
           https://vm.tiktok.com/XXXX/
           https://www.tiktok.com/t/XXXX/
```

Fonction `detectSource(url)` → retourne `"youtube" | "tiktok" | null`.

### 2. Métadonnées — IMPORTANT

**Le web utilise `youtubei.js` (Node.js) pour YouTube. Ce n'est pas disponible en Rust.**

À la place : utiliser **`yt-dlp --dump-json`** pour YouTube ET TikTok.
C'est plus simple, cohérent, et yt-dlp est de toute façon bundlé.

Commande Rust à spawn :
```
yt-dlp --dump-json --no-warnings --no-playlist {url}
```

Champs utiles dans le JSON retourné :
- `title` → titre de la vidéo
- `uploader` → nom de l'auteur
- `duration` → durée en secondes (float)
- `thumbnail` → URL de la miniature
- `formats[]` → liste des formats disponibles

### 3. Filtrage des formats YouTube

Source : `lib/ytdlp-info.ts` du web.

Ne garder que les formats avec `vcodec` commençant par `"avc"` et `acodec == "none"` (streams vidéo seuls).
Trier par `height` décroissant. Dédupliquer par `format_note` (label qualité : "1080p", "720p", etc.).
Ajouter un format synthétique "Audio only (MP3)" avec itag fixe `140`.

### 4. Formats TikTok

Formats fixes (pas de sélection dynamique) :

```rust
// itag 301 = vidéo avec watermark
// itag 302 = vidéo sans watermark
// itag 303 = audio MP3
```

Source : `lib/types.ts` → `TIKTOK_ITAG`.

### 5. Sanitize filename

Source : `lib/serverUtils.ts` → `sanitizeDownloadTitle()`. Logique :
1. NFD normalize
2. Strip diacritics
3. Garder ASCII printable seulement
4. Remplacer `< > : " / \ | ? * #` par `_`
5. Spaces → `_`
6. Collapse `__` → `_`
7. Trim `_` en début/fin
8. Truncate à 80 chars

---

## Types TypeScript du frontend

À copier dans `src/types.ts` :

```typescript
export interface FormatData {
  itag: number;
  qualityLabel: string;
}

export interface VideoData {
  video_details: {
    title: string;
    description: string;
    duration: string;   // string, pas number
    thumbnail: string;
    author: string;
  };
  format: FormatData[];
}

export const TIKTOK_ITAG = {
  WATERMARK: 301,
  NO_WATERMARK: 302,
  AUDIO: 303,
} as const;
```

---

## Gestion des binaires (yt-dlp, ffmpeg)

- **yt-dlp** : binaires standalone disponibles sur github.com/yt-dlp/yt-dlp/releases
  - Windows : `yt-dlp.exe`
  - macOS : `yt-dlp_macos`
  - Android : `yt-dlp` (arm64)
  - À bundler via `tauri.conf.json` → `bundle.resources`

- **ffmpeg** : utiliser `ffmpeg-rs` (crate) ou bundler le binaire statique.
  - Sur desktop, chercher d'abord dans PATH, sinon fallback vers le binaire bundlé.

- **gallery-dl** : **exclu du MVP 1** (pas de binaire Android).

Localisation des binaires au runtime : utiliser `tauri::api::path::resource_dir()` pour trouver
le dossier `resources/` à côté de l'exécutable.

---

## Répertoire temp / cache

Sur le web : `/temp/stroygetter/{source,cached}` (Docker).
En natif : utiliser `app.getPath('userData')` équivalent Tauri → `tauri::api::path::app_data_dir()`.

Structure :
```
{app_data}/stroygetter/
  source/    → fichiers temporaires en cours de merge
  cached/    → MP4s finaux (servis directement si déjà téléchargés)
```

---

## Ce qui N'est PAS à porter

- Tout ce qui concerne `prisma` / LibSQL / `@prisma/adapter-libsql` → remplacé par rusqlite
- `next-intl` → remplacer par une solution i18n Vite (ex: `i18next` + `react-i18next`)
- `ffmpeg-static` npm → binaire bundlé Tauri
- `youtube-dl-exec` npm → spawn Rust natif
- Les API routes Next.js → Tauri commands Rust
- `pino` logger → `tracing` crate Rust côté backend, `console.*` côté frontend
