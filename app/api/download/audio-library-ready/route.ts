import * as fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { trackServer } from "@/lib/analytics-server";
import { guardApiRequest } from "@/lib/api-guard";
import { downloadAndConvertToMp3 } from "@/lib/audio-convert";
import { embedId3Tags } from "@/lib/embed-id3";
import { extractVideoId, getInnertube } from "@/lib/innertube";
import { fetchLyrics } from "@/lib/lyrics";
import { fetchSongMetadata } from "@/lib/metadata";
import { deezerProvider } from "@/lib/metadata/providers/deezer";
import { youtubeMusicProvider } from "@/lib/metadata/providers/youtube-music";
import { buildContentDisposition, cleanFiles, TEMP_DIR } from "@/lib/route-utils";
import { getServerConf } from "@/lib/server-conf";
import { getYtDlpFullInfo, matchSong, resolveCanonicalIdentity } from "@/lib/song-matching";

export async function GET(request: Request) {
  const guard = guardApiRequest(request);
  if (guard) return guard;

  const url = new URL(request.url).searchParams.get("url");
  if (!url) return new Response("Missing url parameter", { status: 400 });

  const { ffmpegPath } = await getServerConf();
  if (!ffmpegPath) return new Response("Server configuration error", { status: 500 });

  const videoId = extractVideoId(url);
  if (!videoId) return new Response("Invalid YouTube URL", { status: 400 });

  const mp3Path = path.join(TEMP_DIR, "source", `audio_library_${videoId}_${Date.now()}.mp3`);

  const innertube = await getInnertube();

  const [innertubeInfo, fullInfo] = await Promise.all([
    innertube.getBasicInfo(videoId),
    getYtDlpFullInfo(url),
  ]);

  const basicDetails = innertubeInfo.basic_info;
  const match = matchSong(
    fullInfo,
    basicDetails.title ?? "Unknown title",
    basicDetails.author ?? "Unknown artist"
  );

  // Phase 2: resolve canonical artist+title via iTunes+Deezer full-text search.
  // Skip when yt-dlp already has native track+artist metadata (YouTube Music official uploads).
  const hasNativeMetadata = !!(fullInfo.track && fullInfo.artist);
  const canonical = hasNativeMetadata
    ? { artist: match.artist, title: match.title }
    : (await resolveCanonicalIdentity(basicDetails.title ?? match.title)) ??
      { artist: match.artist, title: match.title };

  console.log(`[library-ready] Canonical: "${canonical.artist}" - "${canonical.title}"`);

  try {
    const [[meta, ytMusicMeta, deezerMeta, lyrics]] = await Promise.all([
      Promise.all([
        fetchSongMetadata({ artist: canonical.artist, title: canonical.title }),
        youtubeMusicProvider.search({ artist: canonical.artist, title: canonical.title }),
        deezerProvider.search({ artist: canonical.artist, title: canonical.title }),
        fetchLyrics({
          artist: canonical.artist,
          title: canonical.title,
          duration: match.duration,
          language: match.language,
          subtitles: match.subtitles,
          automatic_captions: match.automatic_captions,
        }),
      ]),
      downloadAndConvertToMp3(url, mp3Path, ffmpegPath),
    ]);

    const ytThumbnail = basicDetails.thumbnail?.sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]
      ?.url;

    const songMeta = {
      title: meta?.title ?? canonical.title,
      artist: meta?.artist ?? canonical.artist,
      album: meta?.album ?? canonical.album,
      year: meta?.year ?? canonical.year,
      trackNumber: meta?.trackNumber ?? canonical.trackNumber,
      genre: meta?.genre ?? canonical.genre,
      coverUrl: meta?.coverUrl ?? canonical.coverUrl,
      label: meta?.label,
    };

    await embedId3Tags(mp3Path, {
      metadata: songMeta,
      coverFallbacks: [ytMusicMeta?.coverUrl, deezerMeta?.coverUrl, canonical.coverUrl].filter(Boolean) as string[],
      ytThumbnail,
      sylt: lyrics?.sylt,
      plainLyrics: lyrics?.plain,
      lyricsLanguage: lyrics?.language,
    });

    const stream = fs.createReadStream(mp3Path);
    stream.on("close", () => cleanFiles([mp3Path]));

    void trackServer(
      "library_ready_completed",
      {
        video_id: videoId,
        title: songMeta.title,
        artist: songMeta.artist ?? canonical.artist,
        metadata_fetched: !!meta,
        lyrics_found: !!lyrics,
        cover_found: !!(
          meta?.coverUrl ??
          itunesMeta?.coverUrl ??
          deezerMeta?.coverUrl ??
          ytMusicMeta?.coverUrl ??
          ytThumbnail
        ),
      },
      {
        url: "/api/download/audio-library-ready",
        userAgent: request.headers.get("user-agent") ?? undefined,
        language: request.headers.get("accept-language")?.split(",")[0] ?? undefined,
        referrer: request.headers.get("referer") ?? undefined,
      },
    );

    // biome-ignore lint/suspicious/noExplicitAny: Next.js stream cast
    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": buildContentDisposition(songMeta.title, "mp3"),
      },
    });
  } catch (err) {
    cleanFiles([mp3Path]);
    console.error("[library-ready] Error:", err);
    return new Response("An error occurred while processing", { status: 500 });
  }
}
