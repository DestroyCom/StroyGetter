# Umami Analytics Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Google Analytics with self-hosted Umami and add exhaustive custom event tracking across all user interactions.

**Architecture:** Two helper files (`lib/analytics.ts` for client-side `window.umami.track()`, `lib/analytics-server.ts` for server-side POST to Umami's `/api/send`) keep tracking concerns isolated. All config flows through `siteConfig` as runtime server-only env vars — no `NEXT_PUBLIC_*`. The single server-side event (`library_ready_completed`) is fired fire-and-forget from the API route so it never blocks the response stream.

**Tech Stack:** Next.js 16 App Router, TypeScript, `next/script`, Umami v2 self-hosted, Biome (linting), Vitest (existing tests), pnpm.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `lib/analytics.ts` | Create | `window.umami` types + client-side `track()` guard |
| `lib/analytics-server.ts` | Create | Fire-and-forget POST to Umami `/api/send` |
| `lib/site-config.ts` | Modify | Add `umamiUrl`, `umamiWebsiteId` runtime vars |
| `app/[locale]/layout.tsx` | Modify | Swap `<GoogleAnalytics>` → 2 `<Script>` tags |
| `components/custom/GetterInput.tsx` | Modify | Events: `search`, `url_pasted`, `search_error` |
| `components/custom/VideoSelect.tsx` | Modify | Events: `video_loaded`, `format_changed`, `quality_changed`, `download_started`, `library_ready_used`, `download_failed`, `error_displayed` |
| `components/custom/LocaleSwitcher.tsx` | Modify | Event: `locale_changed` |
| `app/api/download/audio-library-ready/route.ts` | Modify | Event: `library_ready_completed` (server-side) |
| `app/[locale]/legal/cookies/page.tsx` | Modify | Remove GA rich-text, simplify to plain text sections |
| `messages/en.json` | Modify | Update cookies + privacy + terms GA references |
| `messages/fr-FR.json` | Modify | Same |
| `messages/es-419.json` | Modify | Same |
| `messages/pt-BR.json` | Modify | Same |
| `CLAUDE.md` | Modify | Document `UMAMI_URL`, `UMAMI_WEBSITE_ID` env vars |
| `package.json` | Modify | Remove `@next/third-parties` (only used for GA) |

---

## Task 1: Analytics helpers + site-config

**Files:**
- Create: `lib/analytics.ts`
- Create: `lib/analytics-server.ts`
- Modify: `lib/site-config.ts`

- [ ] **Step 1: Create `lib/analytics.ts`**

```typescript
type UmamiData = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    umami?: {
      track(event: string, data?: UmamiData): void;
    };
  }
}

export function track(event: string, data?: UmamiData): void {
  if (typeof window === "undefined" || !window.umami) return;
  window.umami.track(event, data);
}
```

- [ ] **Step 2: Create `lib/analytics-server.ts`**

```typescript
type ServerData = Record<string, string | number | boolean | null | undefined>;

export async function trackServer(
  event: string,
  data?: ServerData,
  context?: { url?: string; hostname?: string },
): Promise<void> {
  const umamiUrl = process.env.UMAMI_URL;
  const websiteId = process.env.UMAMI_WEBSITE_ID;
  if (!umamiUrl || !websiteId) return;

  await fetch(`${umamiUrl}/api/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "event",
      payload: {
        website: websiteId,
        url: context?.url ?? "/",
        hostname:
          context?.hostname ??
          new URL(process.env.SITE_URL ?? "https://stroygetter.fr").hostname,
        name: event,
        data,
      },
    }),
  }).catch(() => {});
}
```

- [ ] **Step 3: Add `umamiUrl` and `umamiWebsiteId` to `lib/site-config.ts`**

Add these two lines inside the `siteConfig` object, after `bingVerification`:

```typescript
  /** Umami analytics self-hosted instance base URL */
  umamiUrl: process.env.UMAMI_URL ?? "https://analytics.stroyco.eu",

  /** Umami website ID for stroygetter.fr */
  umamiWebsiteId:
    process.env.UMAMI_WEBSITE_ID ?? "97703f9b-2cb3-4fe2-9675-49e6a9acbc16",
```

- [ ] **Step 4: Type-check**

```bash
pnpm build
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add lib/analytics.ts lib/analytics-server.ts lib/site-config.ts
git commit -m "feat(analytics): add Umami client and server track helpers"
```

---

## Task 2: Inject Umami scripts in layout

**Files:**
- Modify: `app/[locale]/layout.tsx`

- [ ] **Step 1: Replace the `GoogleAnalytics` import with `Script`**

Remove line 1:
```typescript
import { GoogleAnalytics } from "@next/third-parties/google";
```

Add at the top of the imports (after the existing `import` block):
```typescript
import Script from "next/script";
```

- [ ] **Step 2: Replace the `<GoogleAnalytics>` component at line 137**

Remove:
```tsx
      <GoogleAnalytics gaId="G-X2X4B9LKDW" />
```

Replace with:
```tsx
      <Script
        src={`${siteConfig.umamiUrl}/script.js`}
        data-website-id={siteConfig.umamiWebsiteId}
        strategy="afterInteractive"
      />
      <Script
        src={`${siteConfig.umamiUrl}/recorder.js`}
        data-website-id={siteConfig.umamiWebsiteId}
        data-sample-rate="0.15"
        data-mask-level="moderate"
        data-max-duration="300000"
        strategy="afterInteractive"
      />
```

- [ ] **Step 3: Build and lint**

```bash
pnpm build && pnpm lint
```

Expected: no errors. Confirm `GoogleAnalytics` import is gone.

- [ ] **Step 4: Commit**

```bash
git add app/\[locale\]/layout.tsx
git commit -m "feat(analytics): swap GoogleAnalytics for Umami script + recorder tags"
```

---

## Task 3: GetterInput events

**Files:**
- Modify: `components/custom/GetterInput.tsx`

Three events:
- `search` — every submission, with `{ query, is_url, source: 'typed'|'pasted' }`
- `url_pasted` — when the paste button is clicked (before submit)
- `search_error` — when `searchQuery` throws

- [ ] **Step 1: Import `track`**

Add import at the top of the file (after existing imports):
```typescript
import { track } from "@/lib/analytics";
```

- [ ] **Step 2: Add YouTube URL detector above the component**

Add this helper between the imports and the `export const GetterInput` line:
```typescript
const isYoutubeUrl = (v: string): boolean =>
  v.includes("youtube.com") || v.includes("youtu.be");
```

- [ ] **Step 3: Update `submitUrl` to accept a `source` param and fire events**

Replace the current `submitUrl` function:
```typescript
  const submitUrl = async (value: string, source: "typed" | "pasted" = "typed") => {
    setError("");
    setIsLoading(true);
    track("search", { query: value, is_url: isYoutubeUrl(value), source });
    try {
      const resolvedUrl = await searchQuery(value);
      router.push(`/fetch?videoUrl=${resolvedUrl}`);
    } catch {
      track("search_error", { query: value });
      setError(t("errorNotFound"));
      setIsLoading(false);
    }
  };
```

- [ ] **Step 4: Update `handlePaste` to fire `url_pasted` and pass `source`**

Replace the current `handlePaste` function:
```typescript
  const handlePaste = async (e: React.MouseEvent) => {
    e.stopPropagation();
    let clipText: string;
    try {
      clipText = await navigator.clipboard.readText();
    } catch {
      setPasteError(t("errorClipboard"));
      inputRef.current?.focus();
      setTimeout(() => setPasteError(""), 4000);
      return;
    }
    setUrl(clipText);
    track("url_pasted");
    await submitUrl(clipText, "pasted");
  };
```

- [ ] **Step 5: Update the form `onSubmit` to pass `source: "typed"`**

Replace:
```typescript
      onSubmit={(e) => {
        e.preventDefault();
        const v = (e.currentTarget.elements.namedItem("video-url") as HTMLInputElement).value;
        return submitUrl(v);
      }}
```

With:
```typescript
      onSubmit={(e) => {
        e.preventDefault();
        const v = (e.currentTarget.elements.namedItem("video-url") as HTMLInputElement).value;
        return submitUrl(v, "typed");
      }}
```

- [ ] **Step 6: Build and lint**

```bash
pnpm build && pnpm lint
```

- [ ] **Step 7: Commit**

```bash
git add components/custom/GetterInput.tsx
git commit -m "feat(analytics): track search, url_pasted, search_error in GetterInput"
```

---

## Task 4: VideoSelect events

**Files:**
- Modify: `components/custom/VideoSelect.tsx`

Seven events: `video_loaded`, `format_changed`, `quality_changed`, `download_started`, `library_ready_used`, `download_failed`, `error_displayed`.

- [ ] **Step 1: Import `track`**

Add import at the top of the file (after existing imports):
```typescript
import { track } from "@/lib/analytics";
```

- [ ] **Step 2: Add `extractYtId` helper above the component**

Add between imports and `type Fmt`:
```typescript
const extractYtId = (url: string): string =>
  url.match(/[?&]v=([^&]+)/)?.[1] ?? "";
```

- [ ] **Step 3: Fire `video_loaded` after data loads successfully**

In the `useEffect` that calls `getVideoInfos`, replace the `.then()` success branch:

```typescript
      .then((value) => {
        if (value.error) {
          track("error_displayed", { type: "video_load_error", message: value.error });
          setError(value.error);
          setIsLoading(false);
          return;
        }
        setVideoData(value.video_details);
        setFormats(value.format);
        if (value.format?.[0]?.itag) setSelectedItag(value.format[0].itag.toString());
        setIsLoading(false);
        track("video_loaded", {
          video_id: extractYtId(videoUrl ?? ""),
          title: value.video_details.title,
          author: value.video_details.author,
          duration_s: Number(value.video_details.duration),
          format_count: value.format?.length ?? 0,
        });
      })
      .catch(() => {
        track("error_displayed", { type: "fetch_error", message: "errorFetch" });
        setError(t("errorFetch"));
        setIsLoading(false);
      });
```

- [ ] **Step 4: Add `handleFmtChange` to wrap `setFmt`**

Add this function inside the component, after the `useEffect` blocks and before `handleDownload`:
```typescript
  const handleFmtChange = (next: Fmt) => {
    if (next === fmt) return;
    track("format_changed", { from: fmt, to: next });
    setFmt(next);
  };
```

- [ ] **Step 5: Replace `setFmt` calls in JSX with `handleFmtChange`**

In the format picker `onClick`, replace:
```tsx
                  onClick={() => setFmt(tab.id)}
```
With:
```tsx
                  onClick={() => handleFmtChange(tab.id)}
```

- [ ] **Step 6: Track `quality_changed` in the Select component**

Replace:
```tsx
              <Select value={selectedItag} onValueChange={setSelectedItag} disabled={isDownloading}>
```
With:
```tsx
              <Select
                value={selectedItag}
                onValueChange={(value) => {
                  const label =
                    formats?.find((f) => f.itag.toString() === value)?.qualityLabel ?? value;
                  track("quality_changed", { quality_label: label });
                  setSelectedItag(value);
                }}
                disabled={isDownloading}
              >
```

- [ ] **Step 7: Update `handleDownload` to fire `download_started`, `library_ready_used`, `download_failed`, `error_displayed`**

Replace the full `handleDownload` function:
```typescript
  const handleDownload = async () => {
    if (!videoUrl || !videoData) return;
    setDownloadError(null);
    setIsDownloading(true);
    setLoadProgress(0);

    const videoId = extractYtId(videoUrl);
    const quality =
      fmt === "mp4"
        ? (formats?.find((f) => f.itag.toString() === selectedItag)?.qualityLabel ?? selectedItag)
        : fmt;

    track("download_started", {
      video_id: videoId,
      title: videoData.title,
      format: fmt,
      quality,
    });

    if (fmt === "library-ready") {
      track("library_ready_used", { video_id: videoId, title: videoData.title });
    }

    try {
      const encoded = encodeURIComponent(videoUrl);
      let apiUrl: string;
      if (fmt === "mp3") apiUrl = `/api/download/audio?url=${encoded}`;
      else if (fmt === "library-ready") apiUrl = `/api/download/audio-library-ready?url=${encoded}`;
      else apiUrl = `/api/download/video?url=${encoded}&quality=${selectedItag}`;

      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error("Download failed");

      setLoadProgress(100);

      const ext = fmt === "mp4" ? "mp4" : "mp3";
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${videoData.title}.${ext}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      const reason = e instanceof Error ? e.message : "unknown";
      track("download_failed", { video_id: videoId, reason });
      track("error_displayed", { type: "download_error", message: t("errorDownload") });
      setDownloadError(t("errorDownload"));
    }
    setIsDownloading(false);
  };
```

- [ ] **Step 8: Build and lint**

```bash
pnpm build && pnpm lint
```

- [ ] **Step 9: Commit**

```bash
git add components/custom/VideoSelect.tsx
git commit -m "feat(analytics): track 7 events in VideoSelect"
```

---

## Task 5: LocaleSwitcher event

**Files:**
- Modify: `components/custom/LocaleSwitcher.tsx`

- [ ] **Step 1: Import `track`**

Add after existing imports:
```typescript
import { track } from "@/lib/analytics";
```

- [ ] **Step 2: Update `handleChange` to fire `locale_changed`**

Replace:
```typescript
  function handleChange(next: string) {
    router.replace(pathname, { locale: next });
  }
```
With:
```typescript
  function handleChange(next: string) {
    track("locale_changed", { from: locale, to: next });
    router.replace(pathname, { locale: next });
  }
```

- [ ] **Step 3: Build and lint**

```bash
pnpm build && pnpm lint
```

- [ ] **Step 4: Commit**

```bash
git add components/custom/LocaleSwitcher.tsx
git commit -m "feat(analytics): track locale_changed in LocaleSwitcher"
```

---

## Task 6: Server-side `library_ready_completed`

**Files:**
- Modify: `app/api/download/audio-library-ready/route.ts`

- [ ] **Step 1: Import `trackServer`**

Add after existing imports:
```typescript
import { trackServer } from "@/lib/analytics-server";
```

- [ ] **Step 2: Fire `library_ready_completed` before the success return**

Before the line `return new NextResponse(stream as any, {`, add:

```typescript
    await trackServer(
      "library_ready_completed",
      {
        video_id: videoId,
        title: songMeta.title,
        artist: songMeta.artist ?? match.artist,
        metadata_fetched: !!meta,
        lyrics_found: !!lyrics,
        cover_found: !!(
          meta?.coverUrl ??
          itunesMeta?.coverUrl ??
          deezerMeta?.coverUrl ??
          ytMusicMeta?.coverUrl ??
          ytThumbnail
        ),
      },
      { url: "/api/download/audio-library-ready" },
    );
```

- [ ] **Step 3: Build and lint**

```bash
pnpm build && pnpm lint
```

- [ ] **Step 4: Commit**

```bash
git add app/api/download/audio-library-ready/route.ts
git commit -m "feat(analytics): track library_ready_completed server-side via Umami API"
```

---

## Task 7: Update cookies page component

**Files:**
- Modify: `app/[locale]/legal/cookies/page.tsx`

The current page uses `t.rich()` with `gaCode` and `gaOptOutLink` interpolation. Since sections 02 and 03 are being rewritten as plain text (no inline links or code), both can be simplified to `t()`.

- [ ] **Step 1: Replace section 02 body — remove `t.rich` with `gaCode`**

Replace:
```tsx
          <p>
            {t.rich("cookies02Body", {
              gaCode: (chunks) => (
                <code className="rounded bg-white/8 px-1.5 py-0.5 font-mono">{chunks}</code>
              ),
            })}
          </p>
```
With:
```tsx
          <p>{t("cookies02Body")}</p>
```

- [ ] **Step 2: Replace section 03 body — remove `t.rich` with `gaOptOutLink`**

Replace:
```tsx
          <p>
            {t.rich("cookies03Body", {
              gaOptOutLink: (chunks) => (
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  className="text-stroy-200 underline underline-offset-3 hover:text-white"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
```
With:
```tsx
          <p>{t("cookies03Body")}</p>
```

- [ ] **Step 3: Build and lint**

```bash
pnpm build && pnpm lint
```

- [ ] **Step 4: Commit**

```bash
git add app/\[locale\]/legal/cookies/page.tsx
git commit -m "feat(analytics): simplify cookies page component — remove GA rich-text"
```

---

## Task 8: Update locale files — cookies, privacy, terms

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/fr-FR.json`
- Modify: `messages/es-419.json`
- Modify: `messages/pt-BR.json`

Six keys to update per locale: `cookiesLastUpdated`, `cookies02Title`, `cookies02Body`, `cookies03Title`, `cookies03Body`, `terms03Body`, `privacy03Body`.

- [ ] **Step 1: Update `messages/en.json`**

```json
"cookiesLastUpdated": "Last updated · 22 May 2026",
"cookies02Title": "Privacy-first analytics",
"cookies02Body": "We use Umami, a self-hosted privacy-first analytics tool, to count page visits and understand which features are used most. Umami sets no cookies and collects no personal data. All data is stored exclusively on our own servers.",
"cookies03Title": "Session recordings",
"cookies03Body": "A random sample of 15 % of sessions is recorded (mouse movements, clicks, scrolls) to help us improve the interface. Text inputs are masked, recordings are capped at 5 minutes, and all data is stored on our own servers and never shared with third parties.",
```

For `terms03Body` (in the `"legal"` namespace), replace the existing value:
```json
"terms03Body": "We don't store your downloads — files are streamed directly from our converter to your browser and discarded immediately. We collect anonymous usage statistics (page views, conversion counts, error rates) via Umami, a self-hosted privacy-first analytics tool that sets no cookies and shares no data with third parties.",
```

For `privacy03Body`:
```json
"privacy03Body": "StroyGetter sets no cookies. We use Umami, a self-hosted analytics tool, which tracks page views and interactions without cookies or personal data. A 15 % sample of sessions is recorded to help improve the UI; text inputs are masked and recordings are stored on our own servers.",
```

- [ ] **Step 2: Update `messages/fr-FR.json`**

```json
"cookiesLastUpdated": "Dernière mise à jour · 22 mai 2026",
"cookies02Title": "Analytique respectueuse de la vie privée",
"cookies02Body": "Nous utilisons Umami, un outil d'analytique auto-hébergé respectueux de la vie privée, pour comptabiliser les visites et identifier les fonctionnalités les plus utilisées. Umami ne dépose aucun cookie et ne collecte aucune donnée personnelle. Toutes les données sont stockées exclusivement sur nos propres serveurs.",
"cookies03Title": "Enregistrements de session",
"cookies03Body": "Un échantillon aléatoire de 15 % des sessions est enregistré (mouvements de souris, clics, défilements) afin d'améliorer l'interface. Les champs de saisie sont masqués, les enregistrements sont limités à 5 minutes, et toutes les données sont stockées sur nos propres serveurs sans être partagées avec des tiers.",
```

For `terms03Body`:
```json
"terms03Body": "Nous ne stockons pas vos téléchargements — les fichiers sont diffusés en direct et supprimés. Nous collectons des statistiques d'utilisation anonymes via Umami, un outil d'analytique auto-hébergé qui ne dépose aucun cookie et ne partage aucune donnée avec des tiers.",
```

For `privacy03Body`:
```json
"privacy03Body": "StroyGetter ne dépose aucun cookie. Nous utilisons Umami, un outil d'analytique auto-hébergé, qui mesure les visites et interactions sans cookie ni donnée personnelle. 15 % des sessions sont enregistrées pour améliorer l'interface ; les saisies sont masquées et les enregistrements sont stockés sur nos propres serveurs.",
```

- [ ] **Step 3: Update `messages/es-419.json`**

```json
"cookiesLastUpdated": "Última actualización · 22 de mayo de 2026",
"cookies02Title": "Analítica respetuosa con la privacidad",
"cookies02Body": "Usamos Umami, una herramienta de analítica autoalojada y respetuosa con la privacidad, para contar visitas y entender qué funciones se usan más. Umami no establece cookies ni recopila datos personales. Todos los datos se almacenan exclusivamente en nuestros propios servidores.",
"cookies03Title": "Grabaciones de sesión",
"cookies03Body": "Se graba una muestra aleatoria del 15 % de las sesiones (movimientos del ratón, clics, desplazamientos) para mejorar la interfaz. Los campos de texto se enmascaran, las grabaciones se limitan a 5 minutos y todos los datos se almacenan en nuestros propios servidores sin compartirse con terceros.",
```

For `terms03Body`:
```json
"terms03Body": "No almacenamos tus descargas — los archivos se transmiten directamente y se descartan de inmediato. Recopilamos estadísticas de uso anónimas a través de Umami, una herramienta de analítica autoalojada que no establece cookies ni comparte datos con terceros.",
```

For `privacy03Body`:
```json
"privacy03Body": "StroyGetter no establece cookies. Usamos Umami, una herramienta de analítica autoalojada, que mide visitas e interacciones sin cookies ni datos personales. El 15 % de las sesiones se graba para mejorar la interfaz; las entradas de texto se enmascaran y las grabaciones se almacenan en nuestros propios servidores.",
```

- [ ] **Step 4: Update `messages/pt-BR.json`**

```json
"cookiesLastUpdated": "Última atualização · 22 de maio de 2026",
"cookies02Title": "Análise respeitosa com a privacidade",
"cookies02Body": "Usamos o Umami, uma ferramenta de análise auto-hospedada e respeitosa com a privacidade, para contar visitas e entender quais funcionalidades são mais usadas. O Umami não define cookies nem coleta dados pessoais. Todos os dados são armazenados exclusivamente nos nossos próprios servidores.",
"cookies03Title": "Gravações de sessão",
"cookies03Body": "Uma amostra aleatória de 15 % das sessões é gravada (movimentos do mouse, cliques, rolagens) para melhorar a interface. Os campos de texto são mascarados, as gravações são limitadas a 5 minutos e todos os dados são armazenados nos nossos próprios servidores sem serem compartilhados com terceiros.",
```

For `terms03Body`:
```json
"terms03Body": "Não armazenamos seus downloads — os arquivos são transmitidos diretamente e descartados imediatamente. Coletamos estatísticas de uso anônimas via Umami, uma ferramenta de análise auto-hospedada que não define cookies nem compartilha dados com terceiros.",
```

For `privacy03Body`:
```json
"privacy03Body": "O StroyGetter não define cookies. Usamos o Umami, uma ferramenta de análise auto-hospedada, que mede visitas e interações sem cookies nem dados pessoais. 15 % das sessões são gravadas para melhorar a interface; as entradas de texto são mascaradas e as gravações são armazenadas nos nossos próprios servidores.",
```

- [ ] **Step 5: Build to verify no missing translation keys**

```bash
pnpm build
```

Expected: no TypeScript errors about missing keys.

- [ ] **Step 6: Commit**

```bash
git add messages/en.json messages/fr-FR.json messages/es-419.json messages/pt-BR.json
git commit -m "feat(analytics): update cookies/privacy/terms copy — replace GA with Umami in all 4 locales"
```

---

## Task 9: Cleanup — remove `@next/third-parties` + update CLAUDE.md

**Files:**
- Modify: `package.json`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Verify `@next/third-parties` is no longer imported anywhere**

```bash
grep -r "third-parties" app components lib --include="*.tsx" --include="*.ts"
```

Expected: no output.

- [ ] **Step 2: Remove the package**

```bash
pnpm remove @next/third-parties
```

- [ ] **Step 3: Add Umami env vars to CLAUDE.md**

In the `## Environment Variables` section, add after `BING_SITE_VERIFICATION`:

```markdown
UMAMI_URL=https://analytics.stroyco.eu  # Self-hosted Umami instance base URL (script, recorder, API)
UMAMI_WEBSITE_ID=<id>                   # Umami website ID for stroygetter.fr
```

- [ ] **Step 4: Final build + lint + tests**

```bash
pnpm build && pnpm lint && pnpm test
```

Expected: build passes, lint clean, existing tests still green.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml CLAUDE.md
git commit -m "chore: remove @next/third-parties, document Umami env vars in CLAUDE.md"
```

---

## Verification

After all tasks are complete, run the app and verify in the Umami dashboard:

1. `pnpm dev` — start dev server
2. Open `http://localhost:3000`
3. In Umami → Events, confirm you see:
   - `search` fires when submitting a URL or text query
   - `url_pasted` fires when using the paste button
   - `video_loaded` fires when the fetch page shows video info
   - `format_changed` fires when switching between Library Ready / MP4 / MP3
   - `quality_changed` fires when changing MP4 quality
   - `download_started` + `library_ready_used` fire on download click
   - `locale_changed` fires when switching language
4. For `library_ready_completed`: trigger a Library Ready download and check Umami Events for the server-side event (may take a few seconds to appear).
