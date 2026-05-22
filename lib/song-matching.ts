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

export async function resolveCanonicalIdentity(
  rawTitle: string
): Promise<(SongMetadata & { artist: string; title: string }) | null> {
  const query = stripNoise(rawTitle);
  const [itunes, deezer] = await Promise.all([
    searchItunesByQuery(query),
    searchDeezerByQuery(query),
  ]);
  const candidate = itunes ?? deezer;

  // If both APIs missed, fall back to regex-parsed identity
  if (!candidate?.artist || !candidate?.title) {
    const parsed = parseTitleArtist(rawTitle);
    return parsed ? { artist: parsed.artist, title: parsed.title } : null;
  }

  // Cross-validate: if the API artist doesn't match the parsed artist, the full-text
  // search probably hit a false positive (e.g. "the cure" → The Cure instead of Olivia Rodrigo).
  // Retry with a structured "artist title" query using the parsed identity.
  const parsed = parseTitleArtist(rawTitle);
  if (parsed && !artistsMatch(parsed.artist, candidate.artist)) {
    const structuredQuery = `${parsed.artist} ${parsed.title}`;
    const [retryItunes, retryDeezer] = await Promise.all([
      searchItunesByQuery(structuredQuery),
      searchDeezerByQuery(structuredQuery),
    ]);
    const structured = retryItunes ?? retryDeezer;
    if (structured?.artist && structured?.title) {
      return structured as SongMetadata & { artist: string; title: string };
    }
    return { artist: parsed.artist, title: parsed.title };
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
