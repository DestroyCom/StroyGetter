import { iso6393 } from "iso-639-3";
import { fetchLrclib } from "./lrclib";
import { fetchLyricsOvh } from "./lyrics-ovh";
import { fetchSubtitles } from "./subtitles";
import type { SyltEntry } from "./types";

export type { SyltEntry };

export interface LyricsResult {
  sylt: SyltEntry[];
  plain?: string;
  /** ISO 639-2 3-letter code (e.g. "fra", "jpn") — defaults to "eng" if unknown */
  language: string;
}

function toIso6392(bcp47?: string): string {
  if (!bcp47) return "eng";
  const code = bcp47.split("-")[0].toLowerCase();
  const entry = iso6393.find((l) => l.iso6391 === code);
  return entry?.iso6393 ?? "eng";
}

const DURATION_THRESHOLD = 0.2;

function syltToPlain(entries: SyltEntry[]): string {
  return entries
    .map((e) => e.text)
    .filter(Boolean)
    .join("\n");
}

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
  const lang = toIso6392(query.language);

  // 1. SYLT fiable — LRClib synced + duration validation
  const lrcResult = await fetchLrclib(query.artist, query.title);
  if (lrcResult && lrcResult.sylt.length > 0 && validateDuration(lrcResult.sylt, query.duration)) {
    console.log(`${tag} source=lrclib-sylt lines=${lrcResult.sylt.length}`);
    return { sylt: lrcResult.sylt, plain: lrcResult.plain || undefined, language: lang };
  }

  // 2. SYLT YouTube manuel — artist-uploaded, no duration check needed
  const manualSubs = await fetchSubtitles(query.subtitles, query.language);
  if (manualSubs && manualSubs.length > 0) {
    console.log(`${tag} source=youtube-manual-sylt lines=${manualSubs.length}`);
    return { sylt: manualSubs, plain: syltToPlain(manualSubs), language: lang };
  }

  // 3. Statique fiable — LRClib plain, puis lyrics.ovh
  if (lrcResult?.plain) {
    console.log(`${tag} source=lrclib-plain`);
    return { sylt: [], plain: lrcResult.plain, language: lang };
  }
  const ovhLyrics = await fetchLyricsOvh(query.artist, query.title);
  if (ovhLyrics) {
    console.log(`${tag} source=lyrics-ovh`);
    return { sylt: [], plain: ovhLyrics, language: lang };
  }

  // 4. Statique YouTube — auto-generated captions degraded en texte brut
  const autoSubs = await fetchSubtitles(query.automatic_captions, query.language);
  if (autoSubs && autoSubs.length > 0) {
    console.log(`${tag} source=youtube-auto-plain lines=${autoSubs.length}`);
    return { sylt: [], plain: syltToPlain(autoSubs), language: lang };
  }

  console.log(`${tag} source=none — no lyrics found`);
  return null;
}
