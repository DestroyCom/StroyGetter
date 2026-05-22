# Analytics — Migration GA → Umami avec tracking custom

**Date:** 2026-05-22  
**Statut:** Approuvé

---

## Contexte

Remplacement de Google Analytics (`@next/third-parties/google`, ID `G-X2X4B9LKDW`) par une instance Umami self-hosted (`https://analytics.stroyco.eu`). Objectif : analytics privacy-first sans cookies + tracking exhaustif des interactions utilisateur propres au produit.

Session replays activés côté Umami (15% sample rate, mask level moderate, 5 min max).

---

## Architecture

### Variables d'environnement (runtime server-only)

Ajoutées dans `lib/site-config.ts`, cohérent avec le pattern existant (pas de `NEXT_PUBLIC_*`) :

```
UMAMI_URL=https://analytics.stroyco.eu        # base URL instance Umami
UMAMI_WEBSITE_ID=97703f9b-2cb3-4fe2-9675-49e6a9acbc16
```

Depuis `UMAMI_URL` on dérive :
- Script analytics : `${UMAMI_URL}/script.js`
- Script recorder : `${UMAMI_URL}/recorder.js`
- API send (server-side) : `${UMAMI_URL}/api/send`

### Nouveaux fichiers

**`lib/analytics.ts`** — client-side uniquement  
Types TypeScript pour `window.umami` + fonction `track(event, props?)` avec guard (no-op si `window.umami` pas encore chargé, évite les erreurs SSR/hydration).

**`lib/analytics-server.ts`** — server-side uniquement  
Fonction `trackServer(event, props, request?)` qui POST à `${UMAMI_URL}/api/send`. Fire-and-forget (`.catch(() => {})`) — ne bloque jamais la réponse. Lit `UMAMI_URL` et `UMAMI_WEBSITE_ID` depuis `process.env` directement (pas depuis `siteConfig` pour éviter un import circulaire éventuel).

---

## Injection des scripts — `app/[locale]/layout.tsx`

Remplace `<GoogleAnalytics gaId="..." />` par deux `<Script>` Next.js :

```tsx
<Script
  src={`${siteConfig.umamiUrl}/script.js`}
  data-website-id={siteConfig.umamiWebsiteId}
  strategy="afterInteractive"
  defer
/>
<Script
  src={`${siteConfig.umamiUrl}/recorder.js`}
  data-website-id={siteConfig.umamiWebsiteId}
  data-sample-rate="0.15"
  data-mask-level="moderate"
  data-max-duration="300000"
  strategy="afterInteractive"
  defer
/>
```

Les attributs recorder (`data-sample-rate`, `data-mask-level`, `data-max-duration`) sont hardcodés — config opérationnelle stable, pas de valeur à rendre configurable par env.

---

## Events trackés

Page views : automatiques via Umami, aucun code nécessaire.  
Return user : natif Umami via fingerprinting, aucun code nécessaire.

### Client-side (`lib/analytics.ts` → `window.umami.track`)

#### `search`
Déclencheur : soumission dans `GetterInput` (bouton submit ou paste).  
```ts
{ query: string, is_url: boolean, source: 'typed' | 'pasted' }
```
`is_url` : détecté client-side par `query.includes('youtube.com') || query.includes('youtu.be') || query.includes('youtu')`.

#### `url_pasted`
Déclencheur : clic sur le bouton "Coller" dans `GetterInput`.  
```ts
{ } // pas de props, l'event suffit
```

#### `search_error`
Déclencheur : `searchQuery` throw dans `GetterInput`.  
```ts
{ query: string }
```

#### `video_loaded`
Déclencheur : `VideoSelect` reçoit les données vidéo (dans le `useEffect` après fetch).  
```ts
{ video_id: string, title: string, author: string, duration_s: number, format_count: number }
```
`video_id` extrait de `videoUrl` (searchParam) avec un simple regex `[?&]v=([^&]+)`.

#### `format_changed`
Déclencheur : `setFmt` dans `VideoSelect`.  
```ts
{ from: 'library-ready' | 'mp4' | 'mp3', to: 'library-ready' | 'mp4' | 'mp3' }
```

#### `quality_changed`
Déclencheur : `setSelectedItag` dans `VideoSelect` (sélecteur qualité MP4).  
```ts
{ quality_label: string }
```

#### `download_started`
Déclencheur : clic sur le bouton de téléchargement dans `VideoSelect`.  
```ts
{ video_id: string, title: string, format: 'library-ready' | 'mp4' | 'mp3', quality: string }
```
`quality` : `selectedItag` pour MP4, `'mp3'` / `'library-ready'` pour les autres.

#### `library_ready_used`
Déclencheur : même que `download_started` mais uniquement quand `fmt === 'library-ready'`. Tracké en plus de `download_started` pour visibilité directe dans le dashboard.  
```ts
{ video_id: string, title: string }
```

#### `download_failed`
Déclencheur : `setDownloadError` dans `VideoSelect`.  
```ts
{ video_id: string, reason: string }
```

#### `error_displayed`
Déclencheur : affichage d'une erreur UI dans `VideoSelect`.  
```ts
{ type: string, message: string }
```

#### `locale_changed`
Déclencheur : sélection d'une locale dans `LocaleSwitcher`.  
```ts
{ from: string, to: string }
```

### Server-side (`lib/analytics-server.ts` → POST `/api/send`)

#### `library_ready_completed`
Déclencheur : route `app/api/download/audio-library-ready/route.ts`, juste avant `return new NextResponse(stream, ...)`.  
```ts
{
  video_id: string,
  title: string,
  artist: string,
  metadata_fetched: boolean,  // !!meta
  lyrics_found: boolean,      // !!lyrics
  cover_found: boolean        // !!(meta?.coverUrl || itunesMeta?.coverUrl || deezerMeta?.coverUrl || ytMusicMeta?.coverUrl || ytThumbnail)
}
```

---

## Mise à jour page cookies — 4 locales

Umami ne dépose aucun cookie. La page `/legal/cookies` est simplifiée :
- Suppression des refs Google Analytics (lien opt-out, `gaCode` rich text)
- Nouvelle section : analytics privacy-first sans cookies (Umami)
- Nouvelle section : session replays (comportement utilisateur enregistré sur 15% des sessions, données masquées modérément, durée max 5 min) — requis RGPD même sans cookies

Fichiers à mettre à jour : `messages/en.json`, `messages/fr-FR.json`, `messages/es-419.json`, `messages/pt-BR.json`.

---

## Nettoyage

- Import `GoogleAnalytics` retiré de `app/[locale]/layout.tsx`
- Vérifier si `@next/third-parties` est utilisé ailleurs — si non, retirer du `package.json`
- `CLAUDE.md` : documenter `UMAMI_URL` et `UMAMI_WEBSITE_ID` dans la section env vars

---

## Fichiers modifiés

| Fichier | Action |
|---|---|
| `lib/analytics.ts` | Créé |
| `lib/analytics-server.ts` | Créé |
| `lib/site-config.ts` | +`umamiUrl`, `umamiWebsiteId` |
| `app/[locale]/layout.tsx` | Remplace GA, +2 Script tags |
| `components/custom/GetterInput.tsx` | +`search`, `url_pasted`, `search_error` |
| `components/custom/VideoSelect.tsx` | +`video_loaded`, `format_changed`, `quality_changed`, `download_started`, `library_ready_used`, `download_failed`, `error_displayed` |
| `components/custom/LocaleSwitcher.tsx` | +`locale_changed` |
| `app/api/download/audio-library-ready/route.ts` | +`trackServer('library_ready_completed', ...)` |
| `app/[locale]/legal/cookies/page.tsx` | Retire GA, mentionne Umami + replays |
| `messages/en.json` | Update cookies keys |
| `messages/fr-FR.json` | Update cookies keys |
| `messages/es-419.json` | Update cookies keys |
| `messages/pt-BR.json` | Update cookies keys |
| `CLAUDE.md` | +env vars Umami |
| `package.json` | Retirer `@next/third-parties` si inutilisé |
