import type { MetadataProvider, SongMetadata } from "../types";

export const deezerProvider: MetadataProvider = {
  name: "deezer",
  async search({ artist, title }) {
    try {
      const q = encodeURIComponent(`artist:"${artist}" track:"${title}"`);
      const res = await fetch(`https://api.deezer.com/search?q=${q}&limit=5`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return null;

      const data = await res.json();
      const track = data.data?.[0];
      if (!track) return null;

      // cover_xl = 1000x1000, fallback to cover_big = 500x500
      const coverUrl: string | undefined =
        track.album?.cover_xl ?? track.album?.cover_big ?? undefined;

      return {
        title: track.title as string | undefined,
        artist: track.artist?.name as string | undefined,
        album: track.album?.title as string | undefined,
        coverUrl,
      } satisfies SongMetadata;
    } catch {
      return null;
    }
  },
};
