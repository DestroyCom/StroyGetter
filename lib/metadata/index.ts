import { itunesProvider } from "./providers/itunes";
import { musicbrainzProvider } from "./providers/musicbrainz";
import type { SongMetadata } from "./types";

const providers = [musicbrainzProvider, itunesProvider];

export async function fetchSongMetadata(query: {
  artist: string;
  title: string;
}): Promise<SongMetadata | null> {
  for (const provider of providers) {
    try {
      const result = await provider.search(query);
      if (result && (result.title || result.artist)) {
        console.log(`[metadata] Hit via ${provider.name}`);
        return result;
      }
    } catch {
      // try next provider
    }
  }
  return null;
}

export type { SongMetadata };
