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

// Matches "Artist - Title" and variants like "Artist – Title (Official Video)"
const SEPARATOR_RE = /^(.+?)\s*[-–—]\s*(.+?)(?:\s*[\(\[].*[\)\]])*\s*$/;

function parseTitleArtist(ytTitle: string): { artist: string; title: string } | null {
  const match = ytTitle.match(SEPARATOR_RE);
  if (!match) return null;

  // Strip common YouTube suffixes from the title part
  const title = match[2]
    .replace(/\s*[\(\[](?:official|lyrics?|audio|video|hd|hq|mv|4k|clip)[^\)\]]*[\)\]]/gi, "")
    .trim();

  if (!title) return null;
  return { artist: match[1].trim(), title };
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
