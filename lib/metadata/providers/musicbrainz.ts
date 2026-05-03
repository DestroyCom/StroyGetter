import type { MetadataProvider, SongMetadata } from "../types";

const UA = "StroyGetter/1.0 (github.com/stroygetter)";
const MB_BASE = "https://musicbrainz.org/ws/2";
const CAA_BASE = "https://coverartarchive.org";

export const musicbrainzProvider: MetadataProvider = {
  name: "musicbrainz",
  async search({ artist, title }) {
    try {
      const query = `recording:"${title}" AND artist:"${artist}"`;
      const res = await fetch(
        `${MB_BASE}/recording?query=${encodeURIComponent(query)}&fmt=json&limit=5`,
        { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) return null;

      const data = await res.json();
      const recording = data.recordings?.[0];
      if (!recording) return null;

      const release = recording.releases?.[0];
      const releaseId = release?.id as string | undefined;

      const rawTrackNum = release?.media?.[0]?.track?.[0]?.number;
      const parsedTrack = rawTrackNum ? parseInt(rawTrackNum, 10) : undefined;

      const metadata: SongMetadata = {
        title: recording.title as string | undefined,
        artist: recording["artist-credit"]?.[0]?.artist?.name as string | undefined,
        album: release?.title as string | undefined,
        year: release?.date ? parseInt((release.date as string).split("-")[0], 10) : undefined,
        trackNumber: Number.isFinite(parsedTrack) ? parsedTrack : undefined,
        genre: recording.tags?.[0]?.name as string | undefined,
        label: release?.["label-info"]?.[0]?.label?.name as string | undefined,
      };

      if (releaseId) {
        metadata.coverUrl = `${CAA_BASE}/release/${releaseId}/front`;
      }

      return metadata;
    } catch {
      return null;
    }
  },
};
