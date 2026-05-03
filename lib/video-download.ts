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

  const audioProc = spawn(bin, [...YT_DLP_BASE, "-f", "ba[ext=m4a]/ba[acodec^=mp4a]/ba", url]);
  const videoProc = spawn(bin, [...YT_DLP_BASE, "-f", formatItag, url]);

  if (!audioProc.stdout || !videoProc.stdout) {
    audioProc.kill();
    videoProc.kill();
    throw new Error("Failed to get process stdout");
  }

  const audioOut = audioProc.stdout;
  const videoOut = videoProc.stdout;

  audioProc.stderr?.resume();
  videoProc.stderr?.resume();

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

  if ((audioProc.exitCode ?? 0) !== 0) {
    throw new Error(`yt-dlp audio exited with code ${audioProc.exitCode}`);
  }
  if ((videoProc.exitCode ?? 0) !== 0) {
    throw new Error(`yt-dlp video exited with code ${videoProc.exitCode}`);
  }
}
