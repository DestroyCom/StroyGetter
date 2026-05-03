"use server";

import { spawn } from "node:child_process";
import * as fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { guardApiRequest } from "@/lib/api-guard";
import { extractVideoId, getInnertube } from "@/lib/innertube";
import { prisma } from "@/lib/prisma";
import { getServerConf } from "@/lib/server-conf";
import { sanitizeFilename } from "@/lib/serverUtils";
import { TEMP_DIR, buildContentDisposition, cleanFiles } from "@/lib/route-utils";
import type { FormatData, VideoData } from "@/lib/types";
import { downloadStreamsToFiles } from "@/lib/video-download";
import { getVideoFormats } from "@/lib/ytdlp-info";

const _inFlight = new Map<string, Promise<string>>();

function mergeAudioVideo(
  videoPath: string,
  audioPath: string,
  mergedPath: string,
  ffmpegPath: string,
  queryData: { title: string; url: string; quality: string },
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const proc = spawn(ffmpegPath, [
      "-i", videoPath,
      "-i", audioPath,
      "-c:v", "copy",
      "-c:a", "copy",
      "-y", mergedPath,
    ]);

    proc.stderr.on("data", (d: Buffer) => process.stdout.write(d));
    proc.on("error", reject);
    proc.on("close", async (code: number | null) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg exited with code ${code}`));
        return;
      }
      console.log("Merge done in", (Date.now() - startTime) / 1000, "s");

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

      cleanFiles([videoPath, audioPath]);
      resolve();
    });
  });
}

export async function GET(request: Request) {
  const guard = guardApiRequest(request);
  if (guard) return guard;

  const params = new URL(request.url).searchParams;
  const url = params.get("url");
  const quality = params.get("quality");

  if (!url) return new Response("Missing url parameter", { status: 400 });
  if (!quality) return new Response("Missing quality parameter", { status: 400 });

  const { ffmpegPath } = await getServerConf();
  if (!ffmpegPath) return new Response("Server configuration error", { status: 500 });

  const videoId = extractVideoId(url);
  if (!videoId) return new Response("Invalid YouTube URL", { status: 400 });

  const innertube = await getInnertube();
  const [basicInfo, formats] = await Promise.all([
    innertube.getBasicInfo(videoId),
    getVideoFormats(url),
  ]);

  const details = basicInfo.basic_info;
  const title = details.title ?? "Unknown title";

  const formatMap = new Map<string, FormatData>();
  for (const f of formats) {
    if (!formatMap.has(f.qualityLabel)) formatMap.set(f.qualityLabel, f);
    formatMap.set(String(f.itag), f);
  }

  const selectedFormat = formatMap.get(quality);
  if (!selectedFormat) {
    return new Response(
      `Format not found. Available: ${Array.from(formatMap.keys()).join(", ")}`,
      { status: 400 },
    );
  }

  const videoData: VideoData = {
    video_details: {
      id: videoId,
      title,
      description: details.short_description ?? "",
      duration: String(details.duration ?? 0),
      thumbnail: details.thumbnail?.[0]?.url ?? "",
      author: details.author ?? "",
    },
    format: formats as FormatData[],
  };

  const sanitizedTitle = sanitizeFilename(title || "video");
  const audioPath = path.join(TEMP_DIR, "source", `audio_${sanitizedTitle}_${Date.now()}.mp4`);
  const videoPath = path.join(TEMP_DIR, "source", `video_${sanitizedTitle}_${quality}_${Date.now()}.mp4`);
  const mergedName = `${videoData.video_details.id}_${quality}_${sanitizedTitle}`;
  const mergedPath = path.join(TEMP_DIR, "cached", `${mergedName}.mp4`);
  const cacheKey = `${videoId}:${quality}`;

  const resolveFilePath = async (): Promise<string> => {
    const cached = await prisma.file.findFirst({ where: { video: { url }, quality } });
    if (cached && fs.existsSync(cached.path)) return cached.path;

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

  let pending = _inFlight.get(cacheKey);
  if (!pending) {
    pending = resolveFilePath().finally(() => _inFlight.delete(cacheKey));
    _inFlight.set(cacheKey, pending);
  }

  try {
    const filePath = await pending;
    const stream = fs.createReadStream(filePath);

    // biome-ignore lint/suspicious/noExplicitAny: Next.js stream cast
    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": buildContentDisposition(title, "mp4"),
      },
    });
  } catch (err) {
    console.error("[video] Error:", err);
    return new Response("An error occurred while processing", { status: 500 });
  }
}
