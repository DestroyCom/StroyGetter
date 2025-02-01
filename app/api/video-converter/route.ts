"use server";

import ffmpeg from "fluent-ffmpeg";
import ytdl from "@distube/ytdl-core";
import { PassThrough, Readable } from "stream";
import path from "path";
import * as fs from "fs";
import { initializeConf, sanitizeFilename } from "@/lib/serverUtils";
import { FormatData, VideoData } from "@/lib/types";
import { NextResponse } from "next/server";

const DIFFERENCE_TOLERANCE = 0.2;
const PARENT_PATH =
  process.env.NODE_ENV === "production" ? "/temp/stroygetter" : "./temp";
const CLEANUP_INTERVAL =
  process.env.NODE_ENV === "production" ? 1000 * 60 * 30 : 1000 * 60 * 2;
let CONF = {
  isInitialized: false,
  ffmpegPath: "",
  hasNvidiaCapabilities: false,
};

const createTempDir = (tmp_dir: string) => {
  if (!fs.existsSync(tmp_dir)) {
    fs.mkdirSync(tmp_dir);
  }
};

const getDuration = (filePath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 0);
    });
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
  quality?: string
) => {
  quality = quality || "highestvideo";

  const audioStream = ytdl(url, {
    quality: "highestaudio",
  });

  const videoStream = ytdl(url, {
    quality: quality,
    filter: "videoonly",
  });

  const audioWriteStream = fs.createWriteStream(audio_path);
  const videoWriteStream = fs.createWriteStream(video_path);

  audioStream.pipe(audioWriteStream);
  videoStream.pipe(videoWriteStream);

  await Promise.all([
    waitForStreamClose(audioStream),
    waitForStreamClose(videoStream),
  ]);

  return;
};

const mergeAudioVideo = (
  video_path: string,
  audio_path: string,
  merged_path: string,
  hasNvidiaGpu: boolean
) => {
  return new Promise<void>((resolve, reject) => {
    console.log("Merging audio and video streams");
    const startTime = Date.now();
    const ffmpegCommand = ffmpeg().input(video_path).input(audio_path);

    if (hasNvidiaGpu) {
      ffmpegCommand.outputOptions([
        "-c:v h264_nvenc",
        "-preset fast",
        "-cq 23",
        "-c:a aac",
        "-b:a 128k",
      ]);
    } else {
      ffmpegCommand.outputOptions([
        "-c:v libx264",
        "-preset ultrafast",
        "-crf 23",
        "-c:a aac",
        "-b:a 128k",
      ]);
    }

    ffmpegCommand
      .output(merged_path)
      .on("end", () => {
        const endTime = Date.now();
        const timeTaken = (endTime - startTime) / 1000;
        console.log("Time taken to merge:", timeTaken, "seconds");

        setTimeout(() => {
          cleanPreviousFiles([video_path, audio_path, merged_path]);
        }, CLEANUP_INTERVAL);

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

  const video = await ytdl.getBasicInfo(url);
  const formatMap = new Map();
  (video.player_response.streamingData.adaptiveFormats as FormatData[]).forEach(
    (format: FormatData) => {
      if (!formatMap.has(format.qualityLabel)) {
        formatMap.set(format.qualityLabel, format);
      }
    }
  );

  const videoData: VideoData = {
    video_details: {
      title: video.videoDetails.title,
      description: video.videoDetails.description || "",
      duration: video.videoDetails.lengthSeconds,
      thumbnail: video.videoDetails.thumbnails[0].url,
      author: video.videoDetails.author.name,
    },
    format: Array.from(formatMap.values()),
  };

  //const videoData = await ytdl.getBasicInfo(url);

  if (!videoData) {
    return new Response("An error occurred while fetching video data", {
      status: 500,
    });
  }

  const date =
    video.player_response.microformat.playerMicroformatRenderer.publishDate ||
    new Date().toISOString();

  const metadata = {
    title: videoData.video_details.title || "Unknown title",
    artist: videoData.video_details.author || "Unknown artist",
    author: videoData.video_details.author || "Unknown author",
    year: date.split("T")[0],
    genre: video.videoDetails.keywords
      ? video.videoDetails.keywords.join(", ")
      : "Unknown genre",
    album: videoData.video_details.title || "Unknown album",
  };

  if (quality === "audio") {
    const audioStream = ytdl(url, {
      quality: "highestaudio",
    });

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new NextResponse(audioPassThrough as any, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          (metadata.title || "audio").normalize("NFKD")
        ).replace(/[\u0300-\u036f]/g, "")}.mp3"`,
      },
    });
  }

  const SANITIZED_TITLE = await sanitizeFilename(metadata.title || "video");
  const TEMP_DIR = path.join(PARENT_PATH);
  const VIDEO_FILE_PATH = path.join(
    TEMP_DIR,
    `video_${SANITIZED_TITLE}_${quality}_${Date.now()}.mp4`
  );
  const AUDIO_FILE_PATH = path.join(
    TEMP_DIR,
    `audio_${SANITIZED_TITLE}_${Date.now()}.mp3`
  );
  const MERGED_FILE_PATH = path.join(
    TEMP_DIR,
    `merged_${SANITIZED_TITLE}_${quality}_${Date.now()}.mp4`
  );
  const HAS_NVIDIA_GPU = CONF.hasNvidiaCapabilities;

  try {
    createTempDir(TEMP_DIR);
    await downloadStreams(url, AUDIO_FILE_PATH, VIDEO_FILE_PATH, quality);

    const audioDuration = await getDuration(AUDIO_FILE_PATH);
    const videoDuration = await getDuration(VIDEO_FILE_PATH);

    if (Math.abs(audioDuration - videoDuration) > DIFFERENCE_TOLERANCE) {
      cleanPreviousFiles([AUDIO_FILE_PATH, VIDEO_FILE_PATH]);
      return new Response("Audio and video duration mismatch", { status: 400 });
    } else if (audioDuration === 0 || videoDuration === 0) {
      cleanPreviousFiles([AUDIO_FILE_PATH, VIDEO_FILE_PATH]);
      return new Response("Audio or video duration is zero", { status: 400 });
    }

    await mergeAudioVideo(
      VIDEO_FILE_PATH,
      AUDIO_FILE_PATH,
      MERGED_FILE_PATH,
      HAS_NVIDIA_GPU
    );

    const fileStream = fs.createReadStream(MERGED_FILE_PATH);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new NextResponse(fileStream as any, {
      headers: {
        "Content-Type": quality === "audio" ? "audio/mpeg" : "video/mp4",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          metadata.title || "video"
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
