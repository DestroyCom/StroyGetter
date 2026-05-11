import { getInnertube } from "@/lib/innertube";
import type { MetadataProvider, SongMetadata } from "../types";

interface MusicSong {
  thumbnail?: { contents?: { url: string; width?: number }[] } | null;
  title?: string;
  artists?: { name: string }[];
  album?: { name: string };
}

export const youtubeMusicProvider: MetadataProvider = {
  name: "youtube-music",
  async search({ artist, title }) {
    try {
      const innertube = await getInnertube();
      const results = await innertube.music.search(`${artist} ${title}`, {
        type: "song",
      });

      const song = results.contents?.[0]?.contents?.[0] as MusicSong | undefined;
      if (!song) return null;

      // thumbnail.contents holds the array of sized thumbnails on YT Music
      const thumbs = song.thumbnail?.contents ?? [];
      const best = [...thumbs].sort(
        (a, b) => (b.width ?? 0) - (a.width ?? 0)
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
