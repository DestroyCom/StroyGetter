import { getInnertube } from "@/lib/innertube";
import type { MetadataProvider, SongMetadata } from "../types";

export const youtubeMusicProvider: MetadataProvider = {
  name: "youtube-music",
  async search({ artist, title }) {
    try {
      const innertube = await getInnertube();
      const results = await innertube.music.search(`${artist} ${title}`, {
        type: "song",
      });

      const song = results.contents?.[0]?.contents?.[0];
      if (!song) return null;

      // Thumbnails are actual album art on YT Music (lh3.googleusercontent.com)
      const thumbs = song.thumbnails ?? [];
      const best = thumbs.sort(
        (a: { width?: number }, b: { width?: number }) =>
          (b.width ?? 0) - (a.width ?? 0)
      )[0];
      const coverUrl: string | undefined = best?.url;

      if (!coverUrl) return null;

      return {
        title: song.title as string | undefined,
        artist: song.artists?.[0]?.name as string | undefined,
        album: song.album?.name as string | undefined,
        coverUrl,
      } satisfies SongMetadata;
    } catch {
      return null;
    }
  },
};
