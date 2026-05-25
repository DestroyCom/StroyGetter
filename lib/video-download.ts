import { spawn } from "node:child_process";
import * as fs from "node:fs";
import { getLog } from "@/lib/request-context";
import { getYtDlpBinaryPath } from "@/lib/ytdlp-binary";
import { getCookiesArgs } from "@/lib/ytdlp-cookies";

const DOWNLOAD_TIMEOUT_MS = 5 * 60 * 1000;
const MAX_FILESIZE = process.env.MAX_FILESIZE ?? "8G";

const YT_DLP_BASE = [
  "--no-check-certificates",
  "--no-warnings",
  "--no-playlist",
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
  const log = getLog("video-download");
  const bin = getYtDlpBinaryPath();

  log.info({ url, formatItag, maxFilesize: MAX_FILESIZE }, "Starting parallel yt-dlp download");
  const startTime = Date.now();

  const cookiesArgs = getCookiesArgs();
  const audioProc = spawn(bin, [...YT_DLP_BASE, ...cookiesArgs, "-f", "ba[ext=m4a]/ba[acodec^=mp4a]/ba", url]);
  const videoProc = spawn(bin, [...YT_DLP_BASE, ...cookiesArgs, "-f", formatItag, url]);

  if (!audioProc.stdout || !videoProc.stdout) {
    audioProc.kill();
    videoProc.kill();
    throw new Error("Failed to get process stdout");
  }

  const audioOut = audioProc.stdout;
  const videoOut = videoProc.stdout;

  // Capture stderr from both yt-dlp processes — previously discarded via .resume()
  const collectStderr = (stream: NodeJS.ReadableStream, label: "audio" | "video") => {
    const chunks: Buffer[] = [];
    stream.on("data", (d: Buffer) => chunks.push(d));
    stream.on("end", () => {
      const raw = Buffer.concat(chunks).toString().trim();
      if (!raw) return;
      // yt-dlp writes normal progress info to stderr too — filter out harmless lines
      const lines = raw
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("[download]") && !l.startsWith("[info]"));
      for (const line of lines) {
        if (line.includes("ERROR") || line.includes("error")) {
          log.error({ stream: label, raw: line }, "yt-dlp error output");
        } else {
          log.warn({ stream: label, raw: line }, "yt-dlp stderr");
        }
      }
    });
  };

  if (audioProc.stderr) collectStderr(audioProc.stderr, "audio");
  if (videoProc.stderr) collectStderr(videoProc.stderr, "video");

  audioOut.pipe(fs.createWriteStream(audioPath));
  videoOut.pipe(fs.createWriteStream(videoPath));

  await new Promise<void>((resolve, reject) => {
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      audioProc.kill();
      videoProc.kill();
      log.error(
        { url, formatItag, timeoutMs: DOWNLOAD_TIMEOUT_MS },
        "yt-dlp download timed out — processes killed"
      );
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
    log.error(
      { stream: "audio", exitCode: audioProc.exitCode, url },
      "yt-dlp exited with non-zero code"
    );
    throw new Error(`yt-dlp audio exited with code ${audioProc.exitCode}`);
  }
  if ((videoProc.exitCode ?? 0) !== 0) {
    log.error(
      { stream: "video", exitCode: videoProc.exitCode, url, formatItag },
      "yt-dlp exited with non-zero code"
    );
    throw new Error(`yt-dlp video exited with code ${videoProc.exitCode}`);
  }

  const durationMs = Date.now() - startTime;
  // Measure sizes after pipes have closed
  const audioSize = fs.existsSync(audioPath) ? fs.statSync(audioPath).size : 0;
  const videoSize = fs.existsSync(videoPath) ? fs.statSync(videoPath).size : 0;
  log.info(
    { url, formatItag, durationMs, audioSizeBytes: audioSize, videoSizeBytes: videoSize },
    "yt-dlp parallel download complete"
  );
}
