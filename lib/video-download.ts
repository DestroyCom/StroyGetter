import { spawn } from "node:child_process";
import * as fs from "node:fs";
import { getYtDlpBinaryPath } from "@/lib/ytdlp-binary";

const DOWNLOAD_TIMEOUT_MS = 5 * 60 * 1000;
const MAX_FILESIZE = process.env.MAX_FILESIZE ?? "8G";

const YT_DLP_BASE = [
  "--no-check-certificates",
  "--no-warnings",
  "--max-filesize", MAX_FILESIZE,
  "--add-header", "referer:youtube.com",
  "--add-header", "user-agent:googlebot",
  "-o", "-",
];

function waitForClose(stream: NodeJS.ReadableStream): Promise<void> {
  return new Promise((resolve, reject) => {
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
}

/** Download audio and video streams in parallel to separate files. */
export async function downloadStreamsToFiles(
  url: string,
  audioPath: string,
  videoPath: string,
  formatItag: string,
): Promise<void> {
  const bin = getYtDlpBinaryPath();

  const audioProc = spawn(bin, [
    ...YT_DLP_BASE,
    "-f", "ba[ext=m4a]/ba[acodec^=mp4a]/ba",
    url,
  ]);
  const videoProc = spawn(bin, [
    ...YT_DLP_BASE,
    "-f", formatItag,
    url,
  ]);

  if (!audioProc.stdout || !videoProc.stdout) {
    audioProc.kill();
    videoProc.kill();
    throw new Error("Failed to get process stdout");
  }

  audioProc.stdout.pipe(fs.createWriteStream(audioPath));
  videoProc.stdout.pipe(fs.createWriteStream(videoPath));

  const timeout = setTimeout(() => {
    audioProc.kill();
    videoProc.kill();
  }, DOWNLOAD_TIMEOUT_MS);

  try {
    await Promise.all([
      waitForClose(audioProc.stdout),
      waitForClose(videoProc.stdout),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}
