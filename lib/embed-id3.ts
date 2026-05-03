import NodeID3 from "node-id3";
import type { SyltEntry } from "./lyrics/types";
import type { SongMetadata } from "./metadata/types";

export interface EmbedOptions {
  metadata: SongMetadata;
  sylt?: SyltEntry[];
  plainLyrics?: string;
  lyricsLanguage?: string;
}

export async function embedId3Tags(
  mp3Path: string,
  opts: EmbedOptions,
): Promise<void> {
  const { metadata, sylt, plainLyrics, lyricsLanguage = "eng" } = opts;

  const tags: NodeID3.Tags = {
    title: metadata.title,
    artist: metadata.artist,
    album: metadata.album,
    year: metadata.year?.toString(),
    trackNumber: metadata.trackNumber?.toString(),
    genre: metadata.genre,
    publisher: metadata.label,
  };

  // Cover art — fetched from external URL (MusicBrainz CAA or iTunes)
  if (metadata.coverUrl) {
    try {
      const res = await fetch(metadata.coverUrl);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        const ct = res.headers.get("content-type") ?? "image/jpeg";
        tags.image = {
          mime: ct.includes("png") ? "image/png" : "image/jpeg",
          type: {
            id: NodeID3.TagConstants.AttachedPicture.PictureType.FRONT_COVER,
          },
          description: "Cover",
          imageBuffer: buf,
        };
        console.log(`[embed] cover OK (${Math.round(buf.length / 1024)} KB)`);
      } else {
        console.log(`[embed] cover fetch failed: HTTP ${res.status}`);
      }
    } catch {
      console.log("[embed] cover fetch error — skipped");
    }
  }

  // SYLT — synchronised lyrics
  if (sylt && sylt.length > 0) {
    tags.synchronisedLyrics = [
      {
        language: lyricsLanguage,
        timeStampFormat: NodeID3.TagConstants.TimeStampFormat.MILLISECONDS,
        contentType: NodeID3.TagConstants.SynchronisedLyrics.ContentType.LYRICS,
        synchronisedText: sylt,
      },
    ];
  }

  // USLT — plain lyrics fallback
  if (plainLyrics) {
    tags.unsynchronisedLyrics = { language: lyricsLanguage, text: plainLyrics };
  }

  const hasSylt = (sylt?.length ?? 0) > 0;
  const hasUslt = !!plainLyrics;
  console.log(
    `[embed] writing tags — sylt=${hasSylt} (${sylt?.length ?? 0} lines) uslt=${hasUslt}`,
  );

  const result = NodeID3.write(tags, mp3Path);
  if (result instanceof Error) throw result;
  console.log("[embed] done");
}
