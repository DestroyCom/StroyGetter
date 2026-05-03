import * as fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { guardApiRequest } from "@/lib/api-guard";
import { downloadAndConvertToMp3 } from "@/lib/audio-convert";
import { embedId3Tags } from "@/lib/embed-id3";
import { extractVideoId, getInnertube } from "@/lib/innertube";
import { fetchLyrics } from "@/lib/lyrics";
import { fetchSongMetadata } from "@/lib/metadata";
import { buildContentDisposition, cleanFiles, TEMP_DIR } from "@/lib/route-utils";
import { getServerConf } from "@/lib/server-conf";
import { getYtDlpFullInfo, matchSong } from "@/lib/song-matching";

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

  console.log(`[library-ready] Matched: "${match.artist}" - "${match.title}"`);

  try {
    const [[meta, lyrics]] = await Promise.all([
      Promise.all([
        fetchSongMetadata({ artist: match.artist, title: match.title }),
        fetchLyrics({
          artist: match.artist,
          title: match.title,
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
      title: meta?.title ?? match.title,
      artist: meta?.artist ?? match.artist,
      album: meta?.album,
      year: meta?.year,
      trackNumber: meta?.trackNumber,
      genre: meta?.genre,
      coverUrl: meta?.coverUrl ?? ytThumbnail,
      label: meta?.label,
    };

    await embedId3Tags(mp3Path, {
      metadata: songMeta,
      sylt: lyrics?.sylt,
      plainLyrics: lyrics?.plain,
      lyricsLanguage: lyrics?.language,
    });

    const stream = fs.createReadStream(mp3Path);
    stream.on("close", () => cleanFiles([mp3Path]));

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
