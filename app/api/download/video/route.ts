import { spawn } from "node:child_process";
import * as fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getClientIp, guardApiRequest } from "@/lib/api-guard";
import { extractVideoId, getInnertube } from "@/lib/innertube";
import { prisma } from "@/lib/prisma";
import { generateReqId, getLog, hashIp, runWithRequestContext } from "@/lib/request-context";
import { buildContentDisposition, cleanFiles, TEMP_DIR } from "@/lib/route-utils";
import { getServerConf } from "@/lib/server-conf";
import { sanitizeFilename } from "@/lib/serverUtils";
import type { FormatData, VideoData } from "@/lib/types";
import { downloadStreamsToFiles } from "@/lib/video-download";
import { getVideoFormats } from "@/lib/ytdlp-info";

const _inFlight = new Map<string, Promise<string>>();

function mergeAudioVideo(
  videoPath: string,
  audioPath: string,
  mergedPath: string,
  ffmpegPath: string,
  queryData: { title: string; url: string; quality: string }
): Promise<void> {
  return new Promise((resolve, reject) => {
    const log = getLog("video-merge");
    const startTime = Date.now();
    log.info(
      { videoPath, audioPath, mergedPath, quality: queryData.quality },
      "FFmpeg merge started"
    );

    const proc = spawn(ffmpegPath, [
      "-i",
      videoPath,
      "-i",
      audioPath,
      "-c:v",
      "copy",
      "-c:a",
      "copy",
      "-y",
      mergedPath,
    ]);

    const stderrChunks: Buffer[] = [];
    proc.stderr.on("data", (d: Buffer) => stderrChunks.push(d));

    proc.on("error", (err) => {
      log.error({ err }, "FFmpeg process error");
      reject(err);
    });

    proc.on("close", async (code: number | null) => {
      const durationMs = Date.now() - startTime;
      const stderrRaw = Buffer.concat(stderrChunks).toString().trim();

      if (code !== 0) {
        // Log last relevant stderr lines on failure
        const lastLines = stderrRaw.split("\n").slice(-5).join(" | ");
        log.error(
          { exitCode: code, durationMs, stderr: lastLines, quality: queryData.quality },
          "FFmpeg merge failed"
        );
        reject(new Error(`ffmpeg exited with code ${code}`));
        return;
      }

      const mergedSize = fs.existsSync(mergedPath) ? fs.statSync(mergedPath).size : 0;
      log.info(
        {
          durationMs,
          mergedSizeBytes: mergedSize,
          quality: queryData.quality,
          title: queryData.title,
        },
        "FFmpeg merge complete"
      );

      try {
        await prisma.file.create({
          data: {
            path: mergedPath,
            quality: queryData.quality,
            video: {
              connectOrCreate: {
                where: { url: queryData.url },
                create: { title: queryData.title, url: queryData.url },
              },
            },
          },
        });
        log.debug({ mergedPath, quality: queryData.quality }, "File record saved to DB");
      } catch (dbErr) {
        // Non-fatal — file still exists, just not cached in DB
        log.warn({ err: dbErr, mergedPath }, "Failed to save file record to DB");
      }

      cleanFiles([videoPath, audioPath]);
      resolve();
    });
  });
}

export async function GET(request: Request) {
  const reqId = generateReqId();
  const ip = getClientIp(request);
  const ipHash = hashIp(ip);

  return runWithRequestContext(reqId, ipHash, async () => {
    const log = getLog("video");
    const requestStart = Date.now();

    const params = new URL(request.url).searchParams;
    const url = params.get("url");
    const quality = params.get("quality");

    log.info({ url, quality }, "Video download request received");

    const guard = guardApiRequest(request);
    if (guard) return guard;

    if (!url) {
      log.warn("Missing url parameter");
      return new Response("Missing url parameter", { status: 400 });
    }
    if (!quality) {
      log.warn({ url }, "Missing quality parameter");
      return new Response("Missing quality parameter", { status: 400 });
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

    log.debug({ videoId }, "Fetching innertube basicInfo + yt-dlp formats");
    const innertube = await getInnertube();
    const [basicInfo, formats] = await Promise.all([
      innertube.getBasicInfo(videoId),
      getVideoFormats(url),
    ]);

    const details = basicInfo.basic_info;
    const title = details.title ?? "Unknown title";
    const duration = details.duration ?? 0;

    const formatMap = new Map<string, FormatData>();
    for (const f of formats) {
      if (!formatMap.has(f.qualityLabel)) formatMap.set(f.qualityLabel, f);
      formatMap.set(String(f.itag), f);
    }

    const selectedFormat = formatMap.get(quality);
    if (!selectedFormat) {
      log.warn(
        { quality, available: Array.from(formatMap.keys()).join(", "), videoId },
        "Requested quality not found in available formats"
      );
      return new Response(
        `Format not found. Available: ${Array.from(formatMap.keys()).join(", ")}`,
        {
          status: 400,
        }
      );
    }

    log.debug(
      {
        videoId,
        title,
        durationSec: duration,
        quality,
        itag: selectedFormat.itag,
        formatsCount: formats.length,
      },
      "Video info resolved"
    );

    const videoData: VideoData = {
      video_details: {
        id: videoId,
        title,
        description: details.short_description ?? "",
        duration: String(duration),
        thumbnail: details.thumbnail?.[0]?.url ?? "",
        author: details.author ?? "",
      },
      format: formats as FormatData[],
    };

    const sanitizedTitle = sanitizeFilename(title || "video");
    const audioPath = path.join(TEMP_DIR, "source", `audio_${sanitizedTitle}_${Date.now()}.mp4`);
    const videoPath = path.join(
      TEMP_DIR,
      "source",
      `video_${sanitizedTitle}_${quality}_${Date.now()}.mp4`
    );
    const mergedName = `${videoData.video_details.id}_${quality}_${sanitizedTitle}`;
    const mergedPath = path.join(TEMP_DIR, "cached", `${mergedName}.mp4`);
    const cacheKey = `${videoId}:${quality}`;

    const resolveFilePath = async (): Promise<string> => {
      // Check DB cache first
      const cached = await prisma.file.findFirst({ where: { video: { url }, quality } });
      if (cached && fs.existsSync(cached.path)) {
        log.info({ cacheKey, filePath: cached.path }, "Cache hit — serving existing file");
        return cached.path;
      }
      if (cached && !fs.existsSync(cached.path)) {
        log.warn(
          { cacheKey, filePath: cached.path },
          "Stale DB cache entry — file missing on disk, re-downloading"
        );
      } else {
        log.debug({ cacheKey }, "Cache miss — starting download + merge");
      }

      try {
        await downloadStreamsToFiles(url, audioPath, videoPath, String(selectedFormat.itag));
        await mergeAudioVideo(videoPath, audioPath, mergedPath, ffmpegPath, {
          title,
          url,
          quality,
        });
      } catch (err) {
        cleanFiles([videoPath, audioPath]);
        throw err;
      }
      return mergedPath;
    };

    // Deduplicate concurrent requests for the same video+quality
    let pending = _inFlight.get(cacheKey);
    if (!pending) {
      log.debug({ cacheKey }, "No in-flight download — starting new one");
      pending = resolveFilePath().finally(() => _inFlight.delete(cacheKey));
      _inFlight.set(cacheKey, pending);
    } else {
      log.info({ cacheKey }, "Joining existing in-flight download");
    }

    try {
      const filePath = await pending;
      const fileSizeBytes = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
      const totalMs = Date.now() - requestStart;

      log.info({ cacheKey, filePath, fileSizeBytes, totalMs, title }, "Sending video response");

      const stream = fs.createReadStream(filePath);

      // biome-ignore lint/suspicious/noExplicitAny: Next.js stream cast
      return new NextResponse(stream as any, {
        headers: {
          "Content-Type": "video/mp4",
          "Content-Disposition": buildContentDisposition(title, "mp4"),
        },
      });
    } catch (err) {
      const totalMs = Date.now() - requestStart;
      log.error({ err, url, quality, videoId, totalMs }, "Video download failed");
      return new Response("An error occurred while processing", { status: 500 });
    }
  });
}
