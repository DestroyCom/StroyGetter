# Feature : Music Trim (SponsorBlock)

## Problème

En mode "library ready" (export audio MP3), yt-dlp télécharge parfois le clip vidéo entier, incluant des passages non musicaux (scènes narratives, dialogues, intros cinématiques). L'objectif est de découper automatiquement ces passages pour ne garder que la musique.

## Source de données : SponsorBlock

SponsorBlock est une base communautaire qui référence les segments à sauter dans les vidéos YouTube. La catégorie **`music_offtopic`** correspond exactement aux passages non musicaux dans un clip.

**API utilisée :**
```
GET https://sponsor.ajay.app/api/skipSegments?videoID={videoId}&categories=["music_offtopic"]
```

Retourne un tableau de segments `{ segment: [start, end], locked, votes, ... }` ou **HTTP 404** si aucune donnée n'existe pour cette vidéo.

### Fiabilité testée

| Vidéo | Segments | locked | votes |
|-------|----------|--------|-------|
| Gangnam Style | 2 (intro + outro) | ✓ | 2–7 |
| Adele - Hello | 1 (intro 0–75s) | ✓ | 8 |
| Clip test | 5 segments dispersés | ✓ | 3–9 |
| Vidéo obscure | 404 — aucune donnée | — | — |

**Conclusion** : fiable sur les clips populaires, silencieux sur les vidéos peu connues. Les segments `locked: 1` sont validés par des modérateurs SponsorBlock.

## UX décidée

```
[URL input]
  → fetchVideoinfos() + fetchSponsorBlock(videoId)   ← en parallèle, zéro latence ajoutée
  → page /fetch :
      - si SponsorBlock retourne des segments → afficher le toggle "Get only the music" (beta, désactivé par défaut)
      - si SponsorBlock retourne 404           → cacher le toggle complètement
  → /api/video-converter?trimMusic=true
      → re-fetch SponsorBlock dans le route (simple, stateless)
      → inverser les segments pour obtenir les plages à garder
      → construire le filter_complex FFmpeg
      → exporter le fichier découpé
```

### Comportement du toggle

- **Visible** uniquement si des segments `music_offtopic` existent pour la vidéo
- **Désactivé par défaut** — l'utilisateur choisit explicitement
- **Badge "beta"** — pour gérer les attentes si un clip est mal référencé dans SponsorBlock
- **Description courte** à afficher sous le toggle : expliquer que ça supprime les passages non musicaux (scènes, dialogues) en s'appuyant sur la base SponsorBlock

## Logique de découpe FFmpeg

L'API retourne des segments à **sauter**. Il faut les **inverser** pour obtenir les segments à **garder**.

**Exemple simple** (Adele - Hello, 1 segment skip) :
- Skip : `[0, 74.9]`
- → Keep : `[74.9, 366.9]`

**Exemple complexe** (5 segments skip) :
- Skip : `[0, 6.3]`, `[47.5, 54.2]`, `[67.9, 74.2]`, `[130.4, 138.6]`, `[211.3, 261.0]`
- → Keep : `[6.3, 47.5]`, `[54.2, 67.9]`, `[74.2, 130.4]`, `[138.6, 211.3]`

**Commande FFmpeg générée dynamiquement :**
```bash
ffmpeg -i input.mp4 \
  -filter_complex "
    [0:a]atrim=6.3:47.5,asetpts=N/SR/TB[a1];
    [0:a]atrim=54.2:67.9,asetpts=N/SR/TB[a2];
    [0:a]atrim=74.2:130.4,asetpts=N/SR/TB[a3];
    [0:a]atrim=138.6:211.3,asetpts=N/SR/TB[a4];
    [a1][a2][a3][a4]concat=n=4:v=0:a=1[out]
  " \
  -map "[out]" output.mp3
```

`asetpts=N/SR/TB` recalcule les timestamps pour éviter les sauts dans l'audio après découpe.

## Paramètre route

Un seul paramètre ajouté à la requête : `trimMusic=true`. Le route re-fetche lui-même SponsorBlock avec le videoId — pas besoin de passer les segments dans l'URL.

## Fichiers à modifier

- `functions/` — ajouter `fetchSponsorBlockSegments(videoId)` (server action)
- `app/fetch/page.tsx` — appel parallèle + affichage conditionnel du toggle
- `components/custom/` — nouveau composant toggle "Get only the music"
- `app/api/video-converter/route.ts` — gérer `trimMusic=true`, re-fetch SponsorBlock, construire filter_complex
