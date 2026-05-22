import type { MetadataProvider, SongMetadata } from "../types";

// biome-ignore lint/suspicious/noExplicitAny: iTunes API response
function mapItunesTrack(track: any): SongMetadata {
  const artworkUrl = (track.artworkUrl100 as string | undefined)?.replace("100x100bb", "600x600bb");
  const releaseYear = track.releaseDate
    ? new Date(track.releaseDate as string).getFullYear()
    : undefined;
  return {
    title: track.trackName as string | undefined,
    artist: track.artistName as string | undefined,
    album: track.collectionName as string | undefined,
    year: releaseYear,
    trackNumber: track.trackNumber as number | undefined,
    genre: track.primaryGenreName as string | undefined,
    coverUrl: artworkUrl,
  };
}

export async function searchItunesByQuery(rawQuery: string): Promise<SongMetadata | null> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(rawQuery)}&media=music&entity=song&limit=5`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const track = data.results?.[0];
    if (!track) return null;
    return mapItunesTrack(track);
  } catch {
    return null;
  }
}

export const itunesProvider: MetadataProvider = {
  name: "itunes",
  async search({ artist, title }) {
    return searchItunesByQuery(`${artist} ${title}`);
  },
};
