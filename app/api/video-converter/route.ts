"use server";

import ffmpeg from "fluent-ffmpeg";
import ytdl from "@distube/ytdl-core";
import { video_info } from "play-dl";
import { execSync } from "child_process";
import { PassThrough } from "stream";
import path from "path";
import { title } from "process";
import * as fs from "fs";

const locateFfmpegPath = async () => {
  const localPath = execSync("which ffmpeg").toString().trim();

  return localPath;
};

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
    console.log("Creating temp dir");
    fs.mkdirSync(tmp_dir);
  }
};

const cleanPreviousFiles = (oldPaths: string[]) => {
  oldPaths.forEach((oldPath) => {
    if (fs.existsSync(oldPath)) {
      console.log("Deleting old file at", oldPath);
      fs.unlinkSync(oldPath);
    }
  });
};

const downloadStreams = (
  url: string,
  audio_path: string,
  video_path: string,
  quality?: string
) => {
  quality = quality || "highestvideo";

  return new Promise((resolve, reject) => {
    const audioStream = ytdl(url, { quality: "highestaudio" });
    const videoStream = ytdl(url, { quality });

    const audioWriteStream = fs.createWriteStream(audio_path);
    const videoWriteStream = fs.createWriteStream(video_path);

    audioStream.pipe(audioWriteStream);
    videoStream.pipe(videoWriteStream);

    audioWriteStream.on("finish", () => {
      console.log("Audio downloaded");
      resolve("audio");
    });

    videoWriteStream.on("finish", () => {
      console.log("Video downloaded");
      resolve("video");
    });

    audioStream.on("error", reject);
    videoStream.on("error", reject);
  });
};

const mergeAudioVideo = (
  video_path: string,
  audio_path: string,
  merged_path: string
) => {
  return new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(video_path)
      .input(audio_path)
      .outputOptions("-c:v", "copy") // Copier la vidéo sans ré-encodage
      .outputOptions("-c:a", "aac") // Encoder l'audio en AAC
      .output(merged_path)
      .on("end", () => {
        console.log("Audio and video merged");
        resolve();
      })
      .on("error", reject)
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
    console.log("--------------------");
    console.error("FFmpeg path not found.");
    console.log("--------------------");
    return new Response("An error occurred in the server", { status: 500 });
  } else {
    console.log("--------------------");
    console.log("FFmpeg path found.");
    console.log(ffmpegPath);
    console.log("--------------------");
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

  console.log("------------------------");
  console.log("Quality: ", quality);
  console.log("------------------------");

  const TEMP_DIR = path.join(__dirname, "temp");
  const VIDEO_FILE_PATH = path.join(
    TEMP_DIR,
    `video_${title}_${quality}_${Date.now()}.mp4`
  );
  const AUDIO_FILE_PATH = path.join(
    TEMP_DIR,
    `audio_${title}_${Date.now()}.mp3`
  );
  const MERGED_FILE_PATH = path.join(
    TEMP_DIR,
    `merged_${title}_${quality}_${Date.now()}.mp4`
  );

  try {
    createTempDir(TEMP_DIR);
    await downloadStreams(url, AUDIO_FILE_PATH, VIDEO_FILE_PATH, quality);
    await mergeAudioVideo(VIDEO_FILE_PATH, AUDIO_FILE_PATH, MERGED_FILE_PATH);
    setTimeout(() => {
      cleanPreviousFiles([VIDEO_FILE_PATH, AUDIO_FILE_PATH]);
    }, 600000);

    const fileStream = fs.createReadStream(MERGED_FILE_PATH);
    //@ts-expect-error - L'argument de type n'est pas attribuable au paramètre de type .
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
