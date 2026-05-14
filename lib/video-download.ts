import { spawn } from "node:child_process";
import * as fs from "node:fs";
import { getYtDlpBinaryPath } from "@/lib/ytdlp-binary";

const DOWNLOAD_TIMEOUT_MS = 5 * 60 * 1000;
const MAX_FILESIZE = process.env.MAX_FILESIZE ?? "8G";

const YT_DLP_BASE = [
  "--no-check-certificates",
  "--no-warnings",
  "--max-filesize",
  MAX_FILESIZE,
  "--add-header",
  "referer:youtube.com",
  "--add-header",
  "user-agent:googlebot",
  "--extractor-args",
  "youtube:player_client=tv_embedded",
  "-o",
  "-",
];

function waitForClose(stream: NodeJS.ReadableStream): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      stream.removeListener("end", onEnd);
      stream.removeListener("close", onClose);
      stream.removeListener("error", onError);
    };
    const onEnd = () => {
      cleanup();
      resolve();
    };
    const onClose = () => {
      cleanup();
      resolve();
    };
    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };
    stream.once("end", onEnd);
    stream.once("close", onClose);
    stream.once("error", onError);
  });
}

/** Download audio and video streams in parallel to separate files. */
export async function downloadStreamsToFiles(
  url: string,
  audioPath: string,
  videoPath: string,
  formatItag: string
): Promise<void> {
  const bin = getYtDlpBinaryPath();
  const audioArgs = [...YT_DLP_BASE, "-f", "ba[ext=m4a]/ba[acodec^=mp4a]/ba", url];
  const videoArgs = [...YT_DLP_BASE, "-f", formatItag, url];
  console.log("[video-download] audio args:", audioArgs.join(" "));
  console.log("[video-download] video args:", videoArgs.join(" "));

  const audioProc = spawn(bin, audioArgs);
  const videoProc = spawn(bin, videoArgs);

  if (!audioProc.stdout || !videoProc.stdout) {
    audioProc.kill();
    videoProc.kill();
    throw new Error("Failed to get process stdout");
  }

  const audioOut = audioProc.stdout;
  const videoOut = videoProc.stdout;

  let audioStderr = "";
  let videoStderr = "";
  audioProc.stderr?.on("data", (d: Buffer) => {
    audioStderr += d.toString();
  });
  videoProc.stderr?.on("data", (d: Buffer) => {
    videoStderr += d.toString();
  });

  audioOut.pipe(fs.createWriteStream(audioPath));
  videoOut.pipe(fs.createWriteStream(videoPath));

  await new Promise<void>((resolve, reject) => {
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      audioProc.kill();
      videoProc.kill();
      reject(new Error(`Download timed out after ${DOWNLOAD_TIMEOUT_MS / 1000}s`));
    }, DOWNLOAD_TIMEOUT_MS);

    Promise.all([waitForClose(audioOut), waitForClose(videoOut)])
      .then(() => {
        clearTimeout(timeout);
        if (!timedOut) resolve();
      })
      .catch((err) => {
        clearTimeout(timeout);
        reject(err);
      });
  });

  if (audioStderr) console.warn("[video-download] audio stderr:", audioStderr.trim());
  if (videoStderr) console.warn("[video-download] video stderr:", videoStderr.trim());

  if ((audioProc.exitCode ?? 0) !== 0) {
    throw new Error(
      audioStderr.trim() || `yt-dlp audio exited with code ${audioProc.exitCode}`
    );
  }
  if ((videoProc.exitCode ?? 0) !== 0) {
    throw new Error(
      videoStderr.trim() || `yt-dlp video exited with code ${videoProc.exitCode}`
    );
  }
  console.log("[video-download] Both streams downloaded successfully.");
}
