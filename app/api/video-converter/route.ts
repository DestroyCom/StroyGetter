"use server";

import { spawn } from "node:child_process";
import * as fs from "node:fs";
import path from "node:path";
import { PassThrough, type Readable } from "node:stream";
import { NextResponse } from "next/server";
import { extractVideoId, getInnertube } from "@/lib/innertube";
import { prisma } from "@/lib/prisma";
import {
  initializeConf,
  sanitizeFilename,
  selectYtDlpPath,
} from "@/lib/serverUtils";
import type { FormatData, VideoData } from "@/lib/types";
import { getVideoFormats } from "@/lib/ytdlp-info";

const PARENT_PATH =
  process.env.NODE_ENV === "production" ? "/temp/stroygetter" : "./temp";
const TEMP_DIR = path.join(PARENT_PATH);

let CONF = {
  isInitialized: false,
  ffmpegPath: "",
};
let _confInitPromise: Promise<typeof CONF> | null = null;
const _inFlight = new Map<string, Promise<string>>();

const cleanPreviousFiles = (oldPaths: string[]) => {
  oldPaths.forEach((oldPath) => {
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  });
};

const waitForStreamClose = (stream: Readable) => {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      stream.removeListener("end", onEnd);
      stream.removeListener("close", onClose);
      stream.removeListener("error", onError);
    };
    const onEnd = () => { cleanup(); resolve(); };
    const onClose = () => { cleanup(); resolve(); };
    const onError = (err: Error) => { cleanup(); reject(err); };
    stream.once("end", onEnd);
    stream.once("close", onClose);
    stream.once("error", onError);
  });
};

const DOWNLOAD_TIMEOUT_MS = 5 * 60 * 1000;

const downloadStreams = async (
  url: string,
  audio_path: string,
  video_path: string,
  formatSelector?: string,
) => {
  const ytdl = selectYtDlpPath();
  formatSelector = formatSelector || "bv";

  const audioProc = ytdl.exec(url, {
    noCheckCertificates: true,
    noWarnings: true,
    preferFreeFormats: true,
    addHeader: ["referer:youtube.com", "user-agent:googlebot"],
    format: "ba",
    output: "-",
  });

  const videoProc = ytdl.exec(url, {
    noCheckCertificates: true,
    noWarnings: true,
    preferFreeFormats: true,
    addHeader: ["referer:youtube.com", "user-agent:googlebot"],
    format: formatSelector,
    output: "-",
  });

  const audioStream = audioProc.stdout;
  const videoStream = videoProc.stdout;

  if (!audioStream || !videoStream) {
    throw new Error("Failed to download audio or video stream");
  }
  console.log("Downloading audio and video streams...");

  const audioWriteStream = fs.createWriteStream(audio_path);
  const videoWriteStream = fs.createWriteStream(video_path);

  audioStream.pipe(audioWriteStream);
  videoStream.pipe(videoWriteStream);

  const timeoutHandle = setTimeout(() => {
    audioProc.kill();
    videoProc.kill();
  }, DOWNLOAD_TIMEOUT_MS);

  try {
    await Promise.all([
      waitForStreamClose(audioStream),
      waitForStreamClose(videoStream),
    ]);
  } finally {
    clearTimeout(timeoutHandle);
  }
};

const mergeAudioVideo = (
  video_path: string,
  audio_path: string,
  merged_path: string,
  ffmpegPath: string,
  queryData: {
    title: string;
    url: string;
    quality: string;
  },
) => {
  return new Promise<void>((resolve, reject) => {
    console.log("Merging audio and video streams into one file");
    const startTime = Date.now();

    const args = [
      "-i",
      video_path,
      "-i",
      audio_path,
      "-c:v",
      "copy",
      "-c:a",
      "copy",
      "-y",
      merged_path,
    ];

    const proc = spawn(ffmpegPath, args);
    proc.stderr.on("data", (d: Buffer) => process.stdout.write(d));
    proc.on("error", reject);
    proc.on("close", async (code: number | null) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg exited with code ${code}`));
        return;
      }
      const endTime = Date.now();
      console.log(
        "Time taken to merge:",
        (endTime - startTime) / 1000,
        "seconds",
      );

      await prisma.file.create({
        data: {
          path: merged_path,
          quality: queryData.quality,
          video: {
            connectOrCreate: {
              where: { url: queryData.url },
              create: { title: queryData.title, url: queryData.url },
            },
          },
        },
      });

      cleanPreviousFiles([video_path, audio_path]);
      resolve();
    });
  });
};

export async function GET(request: Request) {
  const urlParams = new URL(request.url).searchParams;
  const url = urlParams.get("url");
  const quality = urlParams.get("quality");

  if (!url) {
    return new Response("Missing URL parameter", { status: 400 });
  }
  if (!quality) {
    return new Response("Missing quality parameter", { status: 400 });
  }

  if (!CONF.isInitialized) {
    if (!_confInitPromise) _confInitPromise = initializeConf(CONF);
    const conf = await _confInitPromise;
    CONF = conf;
  }

  const ffmpegPath = CONF.ffmpegPath;
  if (!ffmpegPath) {
    console.error("FFmpeg path not found");
    return new Response("An error occurred in the server", { status: 500 });
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    return new Response("Invalid URL", { status: 400 });
  }

  const innertube = await getInnertube();

  if (quality === "audio") {
    const audioDetails = (await innertube.getBasicInfo(videoId)).basic_info;
    const metadata = {
      title: audioDetails.title ?? "Unknown title",
      artist: audioDetails.author ?? "Unknown artist",
      author: audioDetails.author ?? "Unknown author",
      year: new Date().getFullYear().toString(),
      genre: "Unknown genre",
      album: audioDetails.title ?? "Unknown album",
    };

    const thumbnails = audioDetails.thumbnail ?? [];
    const bestThumb = thumbnails.reduce(
      (best, t) => ((t.width ?? 0) > (best.width ?? 0) ? t : best),
      thumbnails[0] ?? { url: "" },
    );
    const thumbPath = path.join(TEMP_DIR, "source", `thumb_${videoId}.jpg`);
    let hasThumb = false;
    if (bestThumb?.url) {
      try {
        const thumbRes = await fetch(bestThumb.url);
        if (thumbRes.ok) {
          await fs.promises.writeFile(
            thumbPath,
            Buffer.from(await thumbRes.arrayBuffer()),
          );
          hasThumb = true;
        }
      } catch {
        // proceed without artwork
      }
    }

    const ytdl = selectYtDlpPath();
    const audioStream = ytdl.exec(url, {
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: ["referer:youtube.com", "user-agent:googlebot"],
      format: "ba",
      output: "-",
    }).stdout;
    if (!audioStream) {
      throw new Error("Failed to download audio stream");
    }

    const ffmpegArgs = [
      "-i",
      "pipe:0",
      ...(hasThumb ? ["-i", thumbPath] : []),
      "-map",
      "0:a",
      ...(hasThumb ? ["-map", "1:0"] : []),
      "-codec:a",
      "libmp3lame",
      "-q:a",
      "2",
      ...(hasThumb
        ? [
            "-id3v2_version",
            "3",
            "-metadata:s:v",
            "title=Album cover",
            "-metadata:s:v",
            "comment=Cover (front)",
          ]
        : []),
      "-metadata",
      `title=${metadata.title}`,
      "-metadata",
      `artist=${metadata.artist}`,
      "-metadata",
      `author=${metadata.author}`,
      "-metadata",
      `year=${metadata.year}`,
      "-metadata",
      `genre=${metadata.genre}`,
      "-metadata",
      `album=${metadata.album}`,
      "-f",
      "mp3",
      "pipe:1",
    ];

    const audioPassThrough = new PassThrough();
    const ffmpegAudioProc = spawn(ffmpegPath, ffmpegArgs);
    audioStream.pipe(ffmpegAudioProc.stdin);
    ffmpegAudioProc.stdout.pipe(audioPassThrough, { end: true });
    ffmpegAudioProc.stderr.on("data", (d: Buffer) => process.stdout.write(d));
    ffmpegAudioProc.on("error", (err: Error) =>
      console.error("ffmpeg audio error", err),
    );
    ffmpegAudioProc.on("close", () => {
      console.log("Audio conversion finished");
      if (hasThumb) cleanPreviousFiles([thumbPath]);
    });

    // biome-ignore lint/suspicious/noExplicitAny: Next.js stream cast
    return new NextResponse(audioPassThrough as any, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          (metadata.title || "audio").normalize("NFKD"),
        ).replace(/[\u0300-\u036f]/g, "")}.mp3"`,
      },
    });
  }

  const [basicInfo, formats] = await Promise.all([
    innertube.getBasicInfo(videoId),
    getVideoFormats(url),
  ]);

  const details = basicInfo.basic_info;

  const formatMap = new Map<string, FormatData>();
  formats.forEach((f) => {
    if (!formatMap.has(f.qualityLabel)) {
      formatMap.set(f.qualityLabel, f);
    }
    formatMap.set(String(f.itag), f);
  });

  const videoData: VideoData = {
    video_details: {
      id: videoId,
      title: details.title ?? "",
      description: details.short_description ?? "",
      duration: String(details.duration ?? 0),
      thumbnail: details.thumbnail?.[0]?.url ?? "",
      author: details.author ?? "",
    },
    format: formats as FormatData[],
  };

  const metadata = {
    title: details.title ?? "Unknown title",
    artist: details.author ?? "Unknown artist",
    author: details.author ?? "Unknown author",
    year: new Date().getFullYear().toString(),
    genre: "Unknown genre",
    album: details.title ?? "Unknown album",
  };

  const SANITIZED_TITLE = await sanitizeFilename(metadata.title || "video");

  const VIDEO_FILE_NAME = `video_${SANITIZED_TITLE}_${quality}_${Date.now()}`;
  const VIDEO_FILE_PATH = path.join(
    TEMP_DIR,
    "source",
    `${VIDEO_FILE_NAME}.mp4`,
  );

  const AUDIO_FILE_NAME = `audio_${SANITIZED_TITLE}_${Date.now()}`;
  const AUDIO_FILE_PATH = path.join(
    TEMP_DIR,
    "source",
    `${AUDIO_FILE_NAME}.mp3`,
  );

  const selectedFormat = formatMap.get(quality);
  if (!selectedFormat) {
    console.error(
      `Cannot find the requested format: ${quality}. Available formats: ${Array.from(formatMap.keys()).join(", ")}`,
    );
    return new Response(
      `Cannot find the requested format. Available formats: ${Array.from(formatMap.keys()).join(", ")}`,
      { status: 400 },
    );
  }

  const MERGED_FILE_NAME = `${videoData.video_details.id}_${quality}_${SANITIZED_TITLE}`;
  const merged_file_path = path.join(
    TEMP_DIR,
    "cached",
    `${MERGED_FILE_NAME}.mp4`,
  );
  const cacheKey = `${videoId}:${quality}`;

  const resolveFilePath = async (): Promise<string> => {
    const requestedFile = await prisma.file.findFirst({
      where: { video: { url }, quality },
    });
    if (requestedFile && fs.existsSync(requestedFile.path))
      return requestedFile.path;

    try {
      await downloadStreams(
        url,
        AUDIO_FILE_PATH,
        VIDEO_FILE_PATH,
        String(selectedFormat.itag),
      );
      await mergeAudioVideo(
        VIDEO_FILE_PATH,
        AUDIO_FILE_PATH,
        merged_file_path,
        ffmpegPath,
        {
          title: metadata.title,
          url,
          quality,
        },
      );
    } catch (err) {
      cleanPreviousFiles([VIDEO_FILE_PATH, AUDIO_FILE_PATH]);
      throw err;
    }
    return merged_file_path;
  };

  let pending = _inFlight.get(cacheKey);
  if (!pending) {
    pending = resolveFilePath().finally(() => _inFlight.delete(cacheKey));
    _inFlight.set(cacheKey, pending);
  }

  try {
    const filePath = await pending;
    const fileStream = fs.createReadStream(filePath);

    // biome-ignore lint/suspicious/noExplicitAny: Next.js stream cast
    return new NextResponse(fileStream as any, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          (metadata.title || "video").normalize("NFKD"),
        ).replace(/[\u0300-\u036f]/g, "")}.mp4"`,
      },
    });
  } catch (error) {
    console.error("Error occurred:", error);
    return new Response("An error occurred while processing the video", {
      status: 500,
    });
  }
}
