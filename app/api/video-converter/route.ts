"use server";

import ffmpeg from "fluent-ffmpeg";
import ytdl from "@distube/ytdl-core";
import { video_info } from "play-dl";
import { PassThrough, Readable } from "stream";
import path from "path";
import * as fs from "fs";
import {
  detectFfmpegCapabilities,
  locateFfmpegPath,
  sanitizeFilename,
} from "@/lib/serverUtils";

const DIFFERENCE_TOLERANCE = 0.2;
const PARENT_PATH =
  process.env.NODE_ENV === "production" ? "/temp/stroygetter" : "./temp";
const CLEANUP_INTERVAL =
  process.env.NODE_ENV === "production" ? 1000 * 60 * 30 : 1000 * 60 * 2;

const buildReadableStream = (stream: PassThrough): ReadableStream => {
  return new ReadableStream({
    start(controller) {
      stream.on("data", (chunk: Buffer) => {
        controller.enqueue(chunk);
      });
      stream.on("end", () => {
        controller.close();
      });
    },
  });
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

  const ffmpegPath = await locateFfmpegPath();
  if (!ffmpegPath) {
    console.error("FFmpeg path not found");
    return new Response("An error occurred in the server", { status: 500 });
  } else {
    ffmpeg.setFfmpegPath(ffmpegPath);
  }

  const videoData = await video_info(url);

  if (!videoData || !videoData.video_details || !videoData.format) {
    return new Response("An error occurred while fetching video data", {
      status: 500,
    });
  }

  const date = videoData.video_details.uploadedAt || new Date().toISOString();

  const metadata = {
    title: videoData.video_details.title,
    artist: videoData.video_details.channel?.name || "Unknown artist",
    author: videoData.video_details.channel?.name || "Unknown author",
    year: date.split("T")[0],
    genre: videoData.video_details.type || "Unknown genre",
    album: videoData.video_details.title,
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

    return new Response(buildReadableStream(audioPassThrough), {
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
  const HAS_NVIDIA_GPU = await detectFfmpegCapabilities();

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
    //@ts-expect-error - L'argument de type readstream n'est pas attribuable au paramètre de type Passthrought.
    return new Response(buildReadableStream(fileStream), {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="output.mp4"`,
      },
    });
  } catch (error) {
    console.error("Error occurred:", error);
    return new Response("An error occurred while processing the video", {
      status: 500,
    });
  }
}
