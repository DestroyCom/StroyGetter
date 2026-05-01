"use server";

import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";
import ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";
import { NextResponse } from "next/server";
import path from "path";
import { PassThrough, type Readable } from "stream";
import { extractVideoId, getInnertube } from "@/lib/innertube";
import { initializeConf, sanitizeFilename, selectYtDlpPath } from "@/lib/serverUtils";
import type { FormatData, VideoData } from "@/lib/types";
import { getVideoFormats } from "@/lib/ytdlp-info";

const prisma = new PrismaClient();

const PARENT_PATH = process.env.NODE_ENV === "production" ? "/temp/stroygetter" : "./temp";
const TEMP_DIR = path.join(PARENT_PATH);

let CONF = {
  isInitialized: false,
  ffmpegPath: "",
  hasNvidiaCapabilities: false,
};

const generateFileHash = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = fs.createReadStream(filePath);

    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", (err) => reject(err));
  });
};

const cleanPreviousFiles = (oldPaths: string[]) => {
  oldPaths.forEach((oldPath) => {
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  });
};

const waitForStreamClose = (stream: Readable) => {
  return new Promise<void>((resolve) => {
    stream.on("end", () => {
      resolve();
    });
  });
};

const downloadStreams = async (
  url: string,
  audio_path: string,
  video_path: string,
  formatSelector?: string
) => {
  const ytdl = await selectYtDlpPath();
  formatSelector = formatSelector || "bv";

  const audioStream = ytdl.exec(url, {
    noCheckCertificates: true,
    noWarnings: true,
    preferFreeFormats: true,
    addHeader: ["referer:youtube.com", "user-agent:googlebot"],
    format: "ba",
    output: "-",
  }).stdout;

  const videoStream = ytdl.exec(url, {
    noCheckCertificates: true,
    noWarnings: true,
    preferFreeFormats: true,
    addHeader: ["referer:youtube.com", "user-agent:googlebot"],
    format: formatSelector,
    output: "-",
  }).stdout;
  if (!audioStream || !videoStream) {
    throw new Error("Failed to download audio or video stream");
  }
  console.log("Downloading audio and video streams...");

  const audioWriteStream = fs.createWriteStream(audio_path);
  const videoWriteStream = fs.createWriteStream(video_path);

  audioStream.pipe(audioWriteStream);
  videoStream.pipe(videoWriteStream);

  await Promise.all([waitForStreamClose(audioStream), waitForStreamClose(videoStream)]);

  return;
};

const mergeAudioVideo = (
  video_path: string,
  audio_path: string,
  merged_path: string,
  hasNvidiaGpu: boolean,
  queryData: {
    title: string;
    url: string;
    quality: string;
    qualityLabel: string;
  }
) => {
  return new Promise<void>((resolve, reject) => {
    console.log("Merging audio and video streams into one file");
    const startTime = Date.now();
    const ffmpegCommand = ffmpeg().input(video_path).input(audio_path);

    if (hasNvidiaGpu) {
      ffmpegCommand
        .inputOptions(["-hwaccel cuda", "-hwaccel_device 0", "-c:v h264_cuvid"])
        .outputOptions(["-c:v h264_nvenc", "-preset fast", "-cq 23", "-c:a copy"]);
    } else {
      ffmpegCommand.outputOptions(["-c:v libx264", "-preset ultrafast", "-crf 23", "-c:a copy"]);
    }

    ffmpegCommand
      .output(merged_path)
      .on("end", async () => {
        const endTime = Date.now();
        const timeTaken = (endTime - startTime) / 1000;
        console.log("Time taken to merge:", timeTaken, "seconds");

        const fileHash = await generateFileHash(merged_path);
        console.log("✅ Hash du fichier généré :", fileHash);

        await prisma.file.create({
          data: {
            path: merged_path,
            hash: fileHash,
            quality: queryData.quality,
            qualityLabel: queryData.qualityLabel,
            video: {
              connectOrCreate: {
                where: {
                  url: queryData.url,
                },
                create: {
                  title: queryData.title,
                  url: queryData.url,
                },
              },
            },
          },
        });

        cleanPreviousFiles([video_path, audio_path]);
        resolve();
      })
      .on("error", (err) => {
        console.error("An error occurred while merging audio and video", err);
        reject(err);
      })
      .run();
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

  if (CONF.isInitialized === false) {
    CONF = await initializeConf(CONF);
  }

  const ffmpegPath = CONF.ffmpegPath;
  if (!ffmpegPath) {
    console.error("FFmpeg path not found");
    return new Response("An error occurred in the server", { status: 500 });
  } else {
    ffmpeg.setFfmpegPath(ffmpegPath);
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

    const ytdl = await selectYtDlpPath();
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

    //Convert audio stream to mp3
    const audioPassThrough = new PassThrough();
    ffmpeg(audioStream)
      .setFfmpegPath(ffmpegPath)
      .audioCodec("libmp3lame")
      .format("mp3")
      .outputOptions("-preset", "ultrafast")
      .outputOptions("-metadata", `title=${metadata.title}`)
      .outputOptions("-metadata", `artist=${metadata.artist}`)
      .outputOptions("-metadata", `author=${metadata.author}`)
      .outputOptions("-metadata", `year=${metadata.year}`)
      .outputOptions("-metadata", `genre=${metadata.genre}`)
      .outputOptions("-metadata", `album=${metadata.album}`)
      .on("end", () => {
        console.log("Audio conversion finished");
      })
      .on("progress", (progress) => {
        console.log("Processing: " + progress.timemark + "% done");
      })
      .on("error", (err) => {
        console.error("An error occurred while converting audio", err);
      })
      .pipe(audioPassThrough, { end: true });

    // biome-ignore lint/suspicious/noExplicitAny: Next.js stream cast
    return new NextResponse(audioPassThrough as any, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          (metadata.title || "audio").normalize("NFKD")
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

  if (!videoData) {
    return new Response("An error occurred while fetching video data", {
      status: 500,
    });
  }

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
  const VIDEO_FILE_PATH = path.join(TEMP_DIR, "source", `${VIDEO_FILE_NAME}.mp4`);

  const AUDIO_FILE_NAME = `audio_${SANITIZED_TITLE}_${Date.now()}`;
  const AUDIO_FILE_PATH = path.join(TEMP_DIR, "source", `${AUDIO_FILE_NAME}.mp3`);

  const MERGED_FILE_NAME = `${videoData.video_details.id}_${quality}_${videoData.video_details.title}`;
  let merged_file_path = path.join(TEMP_DIR, "cached", `${MERGED_FILE_NAME}.mp4`);
  const HAS_NVIDIA_GPU = CONF.hasNvidiaCapabilities;

  try {
    const requestedFile = await prisma.file.findFirst({
      where: {
        video: {
          url: url,
          id: videoData.video_details.id,
        },
        quality: quality,
      },
    });

    if (!requestedFile) {
      const selectedFormat = formatMap.get(quality);
      if (!selectedFormat) {
        console.log("formatMap", formatMap);
        console.log("quality", quality);
        console.error(
          `Cannot find the requested format: ${quality}. Available formats are: ${Array.from(
            formatMap.keys()
          ).join(", ")}`
        );

        return new Response(
          `Cannot find the requested format. Available formats are: ${Array.from(
            formatMap.keys()
          ).join(", ")}`,
          { status: 400 }
        );
      }
      await downloadStreams(url, AUDIO_FILE_PATH, VIDEO_FILE_PATH, String(selectedFormat.itag));

      await mergeAudioVideo(VIDEO_FILE_PATH, AUDIO_FILE_PATH, merged_file_path, HAS_NVIDIA_GPU, {
        title: metadata.title,
        url: url,
        quality: quality,
        qualityLabel: formatMap.get(quality)?.qualityLabel || "Unknown",
      });
    } else {
      merged_file_path = requestedFile.path;
    }

    const fileStream = fs.createReadStream(merged_file_path);

    // biome-ignore lint/suspicious/noExplicitAny: Next.js stream cast
    return new NextResponse(fileStream as any, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          (metadata.title || "video").normalize("NFKD")
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
