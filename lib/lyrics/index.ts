import { fetchLrclib } from "./lrclib";
import { fetchSubtitles } from "./subtitles";
import type { SyltEntry } from "./types";

export type { SyltEntry };

export interface LyricsResult {
  sylt: SyltEntry[];
  plain?: string;
}

// Allow ±20% duration drift before discarding synced lyrics
const DURATION_THRESHOLD = 0.2;

function validateDuration(entries: SyltEntry[], durationSec?: number): boolean {
  if (!durationSec || entries.length === 0) return true;
  const lastMs = entries[entries.length - 1].timeStamp;
  const ratio = Math.abs(lastMs / 1000 - durationSec) / durationSec;
  return ratio <= DURATION_THRESHOLD;
}

type SubMap = Record<string, Array<{ ext: string; url: string }>>;

export interface LyricsQuery {
  artist: string;
  title: string;
  duration?: number;
  language?: string;
  subtitles?: SubMap;
  automatic_captions?: SubMap;
}

export async function fetchLyrics(query: LyricsQuery): Promise<LyricsResult | null> {
  const tag = `[lyrics] "${query.artist} - ${query.title}"`;

  // 1. Manual YouTube subs — artist-uploaded, best quality, no duration check needed
  const manualSubs = await fetchSubtitles(query.subtitles, query.language);
  if (manualSubs && manualSubs.length > 0) {
    console.log(`${tag} source=youtube-manual lines=${manualSubs.length}`);
    return { sylt: manualSubs };
  }

  // 2. LRClib (canonical title/artist improves match accuracy)
  const lrcResult = await fetchLrclib(query.artist, query.title);
  if (lrcResult) {
    if (lrcResult.sylt.length > 0 && validateDuration(lrcResult.sylt, query.duration)) {
      console.log(`${tag} source=lrclib synced lines=${lrcResult.sylt.length}`);
      return { sylt: lrcResult.sylt, plain: lrcResult.plain || undefined };
    }
    if (lrcResult.plain) {
      console.log(`${tag} source=lrclib plain-only (sylt duration mismatch or unavailable)`);
      return { sylt: [], plain: lrcResult.plain };
    }
  }

  // 3. Auto-generated YouTube subs (ASR — synced but text quality varies)
  const autoSubs = await fetchSubtitles(query.automatic_captions, query.language);
  if (autoSubs && autoSubs.length > 0 && validateDuration(autoSubs, query.duration)) {
    console.log(`${tag} source=youtube-auto lines=${autoSubs.length}`);
    return { sylt: autoSubs };
  }

  console.log(`${tag} source=none — no lyrics found`);
  return null;
}
