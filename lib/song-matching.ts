import { searchDeezerByQuery } from "@/lib/metadata/providers/deezer";
import { searchItunesByQuery } from "@/lib/metadata/providers/itunes";
import type { SongMetadata } from "@/lib/metadata/types";
import { selectYtDlpPath } from "@/lib/serverUtils";

type SubMap = Record<string, Array<{ ext: string; url: string }>>;

export interface YtDlpFullInfo {
  title?: string;
  track?: string;
  artist?: string;
  album?: string;
  duration?: number;
  language?: string;
  subtitles?: SubMap;
  automatic_captions?: SubMap;
}

export interface CanonicalMatch {
  artist: string;
  title: string;
  album?: string;
  duration?: number;
  language?: string;
  subtitles?: SubMap;
  automatic_captions?: SubMap;
}

export async function getYtDlpFullInfo(url: string): Promise<YtDlpFullInfo> {
  const ytdl = selectYtDlpPath();
  const info = await ytdl(url, {
    dumpJson: true,
    noWarnings: true,
    noCheckCertificates: true,
    addHeader: ["referer:youtube.com", "user-agent:googlebot"],
  });
  return info as unknown as YtDlpFullInfo;
}

// Strips trailing noise (M/V, Official Video, pipe-rest, etc.) from a YouTube title until stable.
export function stripNoise(s: string): string {
  let out = s.replace(/\s*\|.*$/, '').trim();
  let prev = '';
  while (prev !== out) {
    prev = out;
    out = out
      // Bare dash-prefixed noise suffix at end (run first so "- Official Video" strips as one unit)
      .replace(/\s*[-–—]\s*(?:official|officiel|lyrics?|audio|video|music|visualizer|mv|clip|live|performance|remaster(?:ed)?).*/gi, '')
      // Bare MV / M/V at end, optionally preceded by Official or Special (no leading space required)
      .replace(/\s*(?:(?:official|special)\s+)?M\/?V\s*$/i, '')
      // Bare noise keywords at end: Music Video, Official Video, Lyric Video, Audio, Clip
      .replace(/\s*(?:official\s+)?(?:music\s+video|lyric(?:s)?\s+video|audio|video|clip|visualizer)\s*$/i, '')
      // Official alone at end (after other noise already stripped)
      .replace(/\s*official\s*$/i, '')
      // Parenthesised/bracketed noise block at end (\b prevents edit matching edition)
      .replace(/\s*[(\[][^)\]]*\b(?:official|officiel|lyrics?|audio|video|music|hd|hq|mv|4k|8k|clip|visualizer|live|remaster(?:ed)?|version|edit|performance|acoustic)\b[^)\]]*[)\]]\s*$/gi, '')
      // Trailing bare dash left behind after stripping (e.g. "Artist - Title -")
      .replace(/\s*[-–—]\s*$/, '')
      .trim();
  }
  return out;
}

// Quote char class: “=” ‘=’ ‘=’ ’=’ “=” ”=”
// All \uNNNN so the file encoding cannot silently replace them with look-alike chars.
// Pattern 1: Artist - “Title”  (dash + quoted title)
const DASH_QUOTED_RE = /^(.+?)\s*[-–—]\s*[\u0022\u0027\u2018\u2019\u201C\u201D](.+?)[\u0022\u0027\u2018\u2019\u201C\u201D]\s*$/;
// Pattern 2: Artist “Title”  (space-separated, no dash — e.g. TWICE ONE SPARK)
const SPACE_QUOTED_RE = /^(.+?)\s+[\u0022\u0027\u2018\u2019\u201C\u201D](.+?)[\u0022\u0027\u2018\u2019\u201C\u201D]\s*$/;
// Pattern 3: Artist「Title」 / Artist『Title』  (Japanese/Korean corner brackets)
const CORNER_RE = /^(.+?)\s*[「『](.+?)[」』]\s*$/;
// Pattern 4: Artist - Title  (standard dash separator)
const DASH_RE = /^(.+?)\s*[-–—]\s*(.+?)\s*$/;

export function parseTitleArtist(ytTitle: string): { artist: string; title: string } | null {
  const cleaned = stripNoise(ytTitle);
  if (!cleaned) return null;

  const m1 = cleaned.match(DASH_QUOTED_RE);
  if (m1) return { artist: m1[1].trim(), title: m1[2].trim() };

  const m2 = cleaned.match(SPACE_QUOTED_RE);
  if (m2) return { artist: m2[1].trim(), title: m2[2].trim() };

  const m3 = cleaned.match(CORNER_RE);
  if (m3) return { artist: m3[1].trim(), title: m3[2].trim() };

  const m4 = cleaned.match(DASH_RE);
  if (m4) {
    const title = m4[2].trim();
    return title ? { artist: m4[1].trim(), title } : null;
  }

  return null;
}

// Normalises artist names for comparison: lowercase, strip punctuation/spaces/parens.
// "LE SSERAFIM (르세라핌)" and "LE SSERAFIM" both normalise so one includes the other.
function artistsMatch(a: string, b: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[\s,&()[\]'".–—-]/g, "");
  const na = norm(a);
  const nb = norm(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

// Checks whether two song titles refer to the same song.
// Uses exact match after normalisation, substring inclusion (handles "feat." additions),
// and word-overlap for longer titles. Conservative enough to catch "the cure" ≠ "The Rose Song"
// while still matching "deja vu" == "Déjà Vu" or "XO" ⊆ "XO (feat. Artist)".
function titlesSimilar(a: string, b: string): boolean {
  const norm = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\W+/g, " ").trim();
  const na = norm(a);
  const nb = norm(b);
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  // Word overlap: at least one significant word (≥4 chars) in common
  const words = (s: string) => new Set(s.split(" ").filter((w) => w.length >= 4));
  const wa = words(na);
  const wb = words(nb);
  for (const w of wa) if (wb.has(w)) return true;
  return false;
}

function candidateMatchesReference(
  candidate: { artist?: string; title?: string },
  referenceArtist: string | undefined,
  referenceTitle: string | undefined
): boolean {
  const artistOk = !referenceArtist || !candidate.artist || artistsMatch(referenceArtist, candidate.artist);
  const titleOk = !referenceTitle || !candidate.title || titlesSimilar(referenceTitle, candidate.title);
  return artistOk && titleOk;
}

export async function resolveCanonicalIdentity(
  rawTitle: string,
  knownArtist?: string
): Promise<(SongMetadata & { artist: string; title: string }) | null> {
  const query = stripNoise(rawTitle);
  const [itunes, deezer] = await Promise.all([
    searchItunesByQuery(query),
    searchDeezerByQuery(query),
  ]);
  const candidate = itunes ?? deezer;

  const parsed = parseTitleArtist(rawTitle);
  // Reference identity from YouTube: parsed "Artist - Title" or the channel author + stripped title.
  const referenceArtist = parsed?.artist ?? knownArtist;
  const referenceTitle = parsed?.title;

  // If both APIs missed, fall back to known identity
  if (!candidate?.artist || !candidate?.title) {
    if (parsed) return { artist: parsed.artist, title: parsed.title };
    if (knownArtist) return { artist: knownArtist, title: query };
    return null;
  }

  // Cross-validate artist AND title against what we know from YouTube.
  // Catches both "the cure" → The Cure (artist mismatch) and "the cure" → "The Rose Song"
  // (artist matches but wrong song — common when a brand-new track isn't indexed yet).
  if (!candidateMatchesReference(candidate, referenceArtist, referenceTitle)) {
    const structuredQuery = parsed
      ? `${parsed.artist} ${parsed.title}`
      : `${knownArtist} ${query}`;
    const [retryItunes, retryDeezer] = await Promise.all([
      searchItunesByQuery(structuredQuery),
      searchDeezerByQuery(structuredQuery),
    ]);
    const structured = retryItunes ?? retryDeezer;
    if (
      structured?.artist &&
      structured?.title &&
      candidateMatchesReference(structured, referenceArtist, referenceTitle)
    ) {
      return structured as SongMetadata & { artist: string; title: string };
    }
    // Retry also failed validation — fall back to known identity without rich metadata
    if (parsed) return { artist: parsed.artist, title: parsed.title };
    if (knownArtist) return { artist: knownArtist, title: query };
    return null;
  }

  return candidate as SongMetadata & { artist: string; title: string };
}

export function matchSong(
  info: YtDlpFullInfo,
  fallbackTitle: string,
  fallbackArtist: string
): CanonicalMatch {
  const common = {
    duration: info.duration,
    language: info.language,
    subtitles: info.subtitles,
    automatic_captions: info.automatic_captions,
  };

  // Step 1: yt-dlp metadata (populated for official YouTube Music videos)
  if (info.track && info.artist) {
    return { artist: info.artist, title: info.track, album: info.album, ...common };
  }

  // Step 2: parse "Artist - Title" from YouTube title
  const parsed = parseTitleArtist(fallbackTitle);
  if (parsed) {
    return { ...parsed, ...common };
  }

  // Step 3: skip matching — use yt-dlp title/author as-is
  return { artist: fallbackArtist, title: fallbackTitle, ...common };
}
