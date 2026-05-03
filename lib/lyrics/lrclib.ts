import { lrcToSylt } from "./lrc-to-sylt";
import type { SyltEntry } from "./types";

interface LrclibResult {
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
}

export async function fetchLrclib(
  artist: string,
  title: string
): Promise<{ sylt: SyltEntry[]; plain: string } | null> {
  try {
    const params = new URLSearchParams({ artist_name: artist, track_name: title });
    const res = await fetch(`https://lrclib.net/api/search?${params}`, {
      headers: { "Lrclib-Client": "StroyGetter/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const results: LrclibResult[] = await res.json();
    // Prefer results that have synced lyrics
    const best = results.find((r) => r.syncedLyrics) ?? results.find((r) => r.plainLyrics);
    if (!best) return null;

    const plain = best.plainLyrics ?? "";
    const sylt = best.syncedLyrics ? lrcToSylt(best.syncedLyrics) : [];

    if (!plain && sylt.length === 0) return null;
    return { sylt, plain };
  } catch {
    return null;
  }
}
