import NodeID3 from "node-id3";
import sharp from "sharp";
import type { SyltEntry } from "./lyrics/types";
import type { SongMetadata } from "./metadata/types";

export interface EmbedOptions {
  metadata: SongMetadata;
  /** YouTube thumbnail URL used as fallback if the provider cover (metadata.coverUrl) fails */
  ytThumbnail?: string;
  sylt?: SyltEntry[];
  plainLyrics?: string;
  lyricsLanguage?: string;
}

/**
 * Fetches a cover image and normalises it to JPEG or PNG.
 * WebP, AVIF, TIFF and any other format are converted to JPEG via sharp.
 * Returns null if the fetch fails or the image cannot be decoded.
 */
async function fetchCoverBuffer(url: string): Promise<{ buf: Buffer; mime: string } | null> {
  try {
    // 20s — YouTube CDN (i.ytimg.com) and Cover Art Archive redirect chains can be slow
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) {
      console.log(`[embed] cover fetch failed: HTTP ${res.status} — ${url}`);
      return null;
    }

    const raw = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get("content-type") ?? "";

    // JPEG and PNG are natively supported — pass through without re-encoding
    if (ct.includes("jpeg") || ct.includes("jpg") || ct.startsWith("image/jpeg")) {
      return { buf: raw, mime: "image/jpeg" };
    }
    if (ct.includes("png") || ct.startsWith("image/png")) {
      return { buf: raw, mime: "image/png" };
    }

    // Everything else (WebP, AVIF, TIFF, GIF…) — convert to JPEG
    console.log(`[embed] cover is ${ct || "unknown"} — converting to JPEG`);
    const jpeg = await sharp(raw).jpeg({ quality: 92 }).toBuffer();
    return { buf: jpeg, mime: "image/jpeg" };
  } catch (err) {
    console.log(`[embed] cover fetch/convert error — ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

export async function embedId3Tags(mp3Path: string, opts: EmbedOptions): Promise<void> {
  const { metadata, ytThumbnail, sylt, plainLyrics, lyricsLanguage = "eng" } = opts;

  const tags: NodeID3.Tags = {
    title: metadata.title,
    artist: metadata.artist,
    album: metadata.album,
    year: metadata.year?.toString(),
    trackNumber: metadata.trackNumber?.toString(),
    genre: metadata.genre,
    publisher: metadata.label,
  };

  // Cover art — try provider cover (MusicBrainz CAA / iTunes) first, then YouTube thumbnail
  const coverCandidates = [metadata.coverUrl, ytThumbnail].filter(Boolean) as string[];
  for (const url of coverCandidates) {
    const cover = await fetchCoverBuffer(url);
    if (cover) {
      tags.image = {
        mime: cover.mime,
        type: { id: NodeID3.TagConstants.AttachedPicture.PictureType.FRONT_COVER },
        description: "Cover",
        imageBuffer: cover.buf,
      };
      console.log(
        `[embed] cover OK — ${url} (${Math.round(cover.buf.length / 1024)} KB, ${cover.mime})`
      );
      break;
    }
    console.log(`[embed] cover failed for ${url} — trying next source`);
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
    `[embed] writing tags — sylt=${hasSylt} (${sylt?.length ?? 0} lines) uslt=${hasUslt}`
  );

  const result = NodeID3.write(tags, mp3Path);
  if (result instanceof Error) throw result;
  console.log("[embed] done");
}
