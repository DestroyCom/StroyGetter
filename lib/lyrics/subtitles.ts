import type { SyltEntry } from "./types";
import { vttToSylt } from "./vtt-to-sylt";

type SubTrack = Array<{ ext: string; url: string }>;

function findVttUrl(tracks: SubTrack): string | null {
  return tracks.find((t) => t.ext === "vtt")?.url ?? null;
}

/**
 * Fetch subtitles from a YouTube subtitle map for a given target language.
 * Tries the exact language code first, then regional variants (e.g. "en" → "en-US").
 * Defaults to "en" so callers that don't know the language still get sensible results.
 */
export async function fetchSubtitles(
  subsMap: Record<string, SubTrack> | undefined,
  targetLang: string | null | undefined = "en",
): Promise<SyltEntry[] | null> {
  if (!subsMap) return null;

  const lang = targetLang ?? "en";
  const baseLang = lang.split("-")[0]; // "en-US" → "en"
  const allLangs = Object.keys(subsMap);

  // Exact match first, then regional variants of the same base language
  const preferred = [
    lang,
    ...allLangs.filter(
      (k) => k !== lang && (k === baseLang || k.startsWith(`${baseLang}-`)),
    ),
  ];

  for (const candidate of preferred) {
    const tracks = subsMap[candidate];
    if (!tracks) continue;

    const url = findVttUrl(tracks);
    if (!url) continue;

    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const entries = vttToSylt(await res.text());
      if (entries.length > 0) return entries;
    } catch {
      // try next variant
    }
  }

  return null;
}
