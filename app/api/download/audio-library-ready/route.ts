import * as fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { trackServer } from "@/lib/analytics-server";
import { getClientIp, guardApiRequest } from "@/lib/api-guard";
import { downloadAndConvertToMp3 } from "@/lib/audio-convert";
import { embedId3Tags } from "@/lib/embed-id3";
import { extractVideoId, getInnertube } from "@/lib/innertube";
import { fetchLyrics } from "@/lib/lyrics";
import { fetchSongMetadata } from "@/lib/metadata";
import { deezerProvider } from "@/lib/metadata/providers/deezer";
import { youtubeMusicProvider } from "@/lib/metadata/providers/youtube-music";
import { generateReqId, getLog, hashIp, runWithRequestContext } from "@/lib/request-context";
import { buildContentDisposition, cleanFiles, TEMP_DIR } from "@/lib/route-utils";
import { getServerConf } from "@/lib/server-conf";
import { getYtDlpFullInfo, matchSong, resolveCanonicalIdentity } from "@/lib/song-matching";

export async function GET(request: Request) {
  const reqId = generateReqId();
  const ip = getClientIp(request);
  const ipHash = hashIp(ip);

  return runWithRequestContext(reqId, ipHash, async () => {
    const log = getLog("library-ready");
    const requestStart = Date.now();

    const url = new URL(request.url).searchParams.get("url");

    log.info({ url }, "Library-ready audio request received");

    const guard = guardApiRequest(request);
    if (guard) return guard;

    if (!url) {
      log.warn("Missing url parameter");
      return new Response("Missing url parameter", { status: 400 });
    }

    let ffmpegPath: string;
    try {
      ({ ffmpegPath } = await getServerConf());
    } catch (err) {
      log.error({ err }, "Server configuration unavailable");
      return new Response("Server configuration error", { status: 500 });
    }
    if (!ffmpegPath) return new Response("Server configuration error", { status: 500 });

    const videoId = extractVideoId(url);
    if (!videoId) {
      log.warn({ url }, "Invalid YouTube URL — could not extract video ID");
      return new Response("Invalid YouTube URL", { status: 400 });
    }

    const mp3Path = path.join(TEMP_DIR, "source", `audio_library_${videoId}_${Date.now()}.mp3`);
    const innertube = await getInnertube();

    // ── Phase 1: Song matching ────────────────────────────────────────────────
    log.debug({ videoId }, "Phase 1 — fetching innertube info + yt-dlp full info");
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

    log.info(
      {
        videoId,
        matchArtist: match.artist,
        matchTitle: match.title,
        hasNativeYtdlpMeta: !!(fullInfo.track && fullInfo.artist),
      },
      "Phase 1 — song match result"
    );

    // ── Phase 2: Canonical identity ───────────────────────────────────────────
    const hasNativeMetadata = !!(fullInfo.track && fullInfo.artist);
    let canonical: { artist: string; title: string; album?: string; year?: number; trackNumber?: number; genre?: string; coverUrl?: string; label?: string };

    if (hasNativeMetadata) {
      canonical = { artist: match.artist, title: match.title };
      log.debug({ videoId }, "Phase 2 — skipped (native yt-dlp metadata available)");
    } else {
      log.debug(
        { videoId, rawTitle: basicDetails.title, rawArtist: match.artist },
        "Phase 2 — resolving canonical identity via iTunes+Deezer"
      );
      const resolved = await resolveCanonicalIdentity(
        basicDetails.title ?? match.title,
        match.artist
      );
      canonical = resolved ?? { artist: match.artist, title: match.title };
      if (resolved) {
        log.info(
          { videoId, canonicalArtist: canonical.artist, canonicalTitle: canonical.title },
          "Phase 2 — canonical identity resolved"
        );
      } else {
        log.warn(
          { videoId, rawArtist: match.artist, rawTitle: match.title },
          "Phase 2 — canonical identity not resolved, using raw match"
        );
      }
    }

    try {
      // ── Phase 3: Parallel metadata + download ─────────────────────────────
      log.debug(
        { videoId, artist: canonical.artist, title: canonical.title },
        "Phase 3 — starting parallel metadata fetch + MP3 download"
      );
      const phase3Start = Date.now();

      const [[meta, ytMusicMeta, deezerMeta, lyrics]] = await Promise.all([
        Promise.all([
          fetchSongMetadata({ artist: canonical.artist, title: canonical.title })
            .then((r) => {
              log.debug(
                { videoId, found: !!r, provider: "fetchSongMetadata" },
                "Metadata provider returned"
              );
              return r;
            })
            .catch((err) => {
              log.warn({ videoId, err, provider: "fetchSongMetadata" }, "Metadata provider failed");
              return null;
            }),
          youtubeMusicProvider
            .search({ artist: canonical.artist, title: canonical.title })
            .then((r) => {
              log.debug(
                { videoId, found: !!r, provider: "youtube-music" },
                "Metadata provider returned"
              );
              return r;
            })
            .catch((err) => {
              log.warn({ videoId, err, provider: "youtube-music" }, "Metadata provider failed");
              return null;
            }),
          deezerProvider
            .search({ artist: canonical.artist, title: canonical.title })
            .then((r) => {
              log.debug({ videoId, found: !!r, provider: "deezer" }, "Metadata provider returned");
              return r;
            })
            .catch((err) => {
              log.warn({ videoId, err, provider: "deezer" }, "Metadata provider failed");
              return null;
            }),
          fetchLyrics({
            artist: canonical.artist,
            title: canonical.title,
            duration: match.duration,
            language: match.language,
            subtitles: match.subtitles,
            automatic_captions: match.automatic_captions,
          })
            .then((r) => {
              log.debug({ videoId, found: !!r, provider: r ? "lyrics" : "none" }, "Lyrics result");
              return r;
            })
            .catch((err) => {
              log.warn({ videoId, err }, "Lyrics fetch failed");
              return null;
            }),
        ]),
        downloadAndConvertToMp3(url, mp3Path, ffmpegPath),
      ]);

      log.info(
        {
          videoId,
          durationMs: Date.now() - phase3Start,
          hasMeta: !!meta,
          hasYtMusic: !!ytMusicMeta,
          hasDeezer: !!deezerMeta,
          hasLyrics: !!lyrics,
        },
        "Phase 3 — metadata + download complete"
      );

      // ── Phase 4: ID3 embedding ────────────────────────────────────────────
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

      log.debug(
        {
          videoId,
          title: songMeta.title,
          artist: songMeta.artist,
          hasCoverUrl: !!songMeta.coverUrl,
          hasYtThumb: !!ytThumbnail,
        },
        "Phase 4 — embedding ID3 tags"
      );

      await embedId3Tags(mp3Path, {
        metadata: songMeta,
        coverFallbacks: [ytMusicMeta?.coverUrl, deezerMeta?.coverUrl, canonical.coverUrl].filter(
          Boolean
        ) as string[],
        ytThumbnail,
        sylt: lyrics?.sylt,
        plainLyrics: lyrics?.plain,
        lyricsLanguage: lyrics?.language,
      });

      const fileSizeBytes = fs.existsSync(mp3Path) ? fs.statSync(mp3Path).size : 0;
      const totalMs = Date.now() - requestStart;

      log.info(
        {
          videoId,
          title: songMeta.title,
          artist: songMeta.artist,
          fileSizeBytes,
          totalMs,
          hasCover: !!(
            meta?.coverUrl ??
            deezerMeta?.coverUrl ??
            ytMusicMeta?.coverUrl ??
            canonical.coverUrl ??
            ytThumbnail
          ),
          hasLyrics: !!lyrics,
        },
        "Library-ready audio complete — sending response"
      );

      const stream = fs.createReadStream(mp3Path);
      stream.on("close", () => cleanFiles([mp3Path]));

      const metadataSource = meta ? "primary" : ytMusicMeta ? "youtube-music" : deezerMeta ? "deezer" : "fallback";
      const coverSource = meta?.coverUrl ? "primary" : ytMusicMeta?.coverUrl ? "youtube-music" : deezerMeta?.coverUrl ? "deezer" : canonical.coverUrl ? "canonical" : ytThumbnail ? "youtube-thumbnail" : null;

      void trackServer(
        "library_ready_completed",
        {
          video_id: videoId,
          title: songMeta.title,
          artist: songMeta.artist ?? canonical.artist,
          metadata_fetched: !!meta,
          metadata_source: metadataSource,
          has_native_metadata: hasNativeMetadata,
          lyrics_found: !!lyrics,
          cover_found: !!(meta?.coverUrl ?? deezerMeta?.coverUrl ?? ytMusicMeta?.coverUrl ?? canonical.coverUrl ?? ytThumbnail),
          cover_source: coverSource,
        },
        {
          url: "/api/download/audio-library-ready",
          userAgent: request.headers.get("user-agent") ?? undefined,
          language: request.headers.get("accept-language")?.split(",")[0] ?? undefined,
          referrer: request.headers.get("referer") ?? undefined,
        }
      );

      // biome-ignore lint/suspicious/noExplicitAny: Next.js stream cast
      return new NextResponse(stream as any, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Disposition": buildContentDisposition(songMeta.title, "mp3"),
        },
      });
    } catch (err) {
      const totalMs = Date.now() - requestStart;
      cleanFiles([mp3Path]);
      log.error({ err, url, videoId, canonical, totalMs }, "Library-ready audio failed");
      return new Response("An error occurred while processing", { status: 500 });
    }
  });
}
