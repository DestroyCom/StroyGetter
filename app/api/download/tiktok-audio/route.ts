import { spawn } from "node:child_process";
import * as fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getClientIp, guardApiRequest } from "@/lib/api-guard";
import { generateReqId, getLog, hashIp, runWithRequestContext } from "@/lib/request-context";
import { buildContentDisposition, cleanFiles, TEMP_DIR } from "@/lib/route-utils";
import { getServerConf } from "@/lib/server-conf";
import { tiktok_validate } from "@/lib/serverUtils";
import { getYtDlpBinaryPath } from "@/lib/ytdlp-binary";
import { getCookiesArgs } from "@/lib/ytdlp-cookies";

// Prefer a pure audio stream if available; fall back to best muxed stream with audio.
// The [acodec!=none] guard prevents downloading a video-only stream that would produce
// a silent MP3 after ffmpeg extraction.
const TIKTOK_AUDIO_FORMAT = "bestaudio[acodec!=none]/best[acodec!=none][format_id!=download]";
const DOWNLOAD_TIMEOUT_MS = 5 * 60 * 1000;
const MAX_FILESIZE = process.env.MAX_FILESIZE ?? "8G";

function downloadTiktokToFile(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const log = getLog("tiktok-audio-download");
    const bin = getYtDlpBinaryPath();
    const cookiesArgs = getCookiesArgs();

    const args = [
      "--no-check-certificates",
      "--no-warnings",
      "--no-playlist",
      "--max-filesize",
      MAX_FILESIZE,
      ...cookiesArgs,
      "-f",
      TIKTOK_AUDIO_FORMAT,
      "-o",
      outputPath,
      url,
    ];

    log.info({ url, outputPath }, "Starting yt-dlp TikTok download for audio extraction");
    const startTime = Date.now();

    const proc = spawn(bin, args);

    const stderrChunks: Buffer[] = [];
    if (proc.stderr) {
      proc.stderr.on("data", (d: Buffer) => stderrChunks.push(d));
    }

    const timeout = setTimeout(() => {
      proc.kill();
      log.error({ url, timeoutMs: DOWNLOAD_TIMEOUT_MS }, "yt-dlp timed out");
      reject(new Error(`yt-dlp timed out after ${DOWNLOAD_TIMEOUT_MS / 1000}s`));
    }, DOWNLOAD_TIMEOUT_MS);

    proc.on("error", (err) => {
      clearTimeout(timeout);
      log.error({ err }, "yt-dlp process error");
      reject(err);
    });

    proc.on("close", (code: number | null) => {
      clearTimeout(timeout);
      const durationMs = Date.now() - startTime;
      const stderrRaw = Buffer.concat(stderrChunks).toString().trim();

      if (code !== 0) {
        const lastLines = stderrRaw.split("\n").slice(-5).join(" | ");
        log.error(
          { exitCode: code, durationMs, stderr: lastLines, url },
          "yt-dlp exited with non-zero code"
        );
        reject(new Error(`yt-dlp exited with code ${code}`));
        return;
      }

      const fileSize = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0;
      log.info({ durationMs, fileSizeBytes: fileSize, url }, "yt-dlp download complete");
      resolve();
    });
  });
}

function extractAudioWithFfmpeg(
  ffmpegPath: string,
  inputPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const log = getLog("tiktok-audio-ffmpeg");

    const args = ["-i", inputPath, "-vn", "-acodec", "libmp3lame", "-ab", "192k", "-y", outputPath];

    log.info({ inputPath, outputPath }, "Starting FFmpeg audio extraction");
    const startTime = Date.now();

    const proc = spawn(ffmpegPath, args);

    const stderrChunks: Buffer[] = [];
    if (proc.stderr) {
      proc.stderr.on("data", (d: Buffer) => stderrChunks.push(d));
    }

    proc.on("error", (err) => {
      log.error({ err }, "FFmpeg process error");
      reject(err);
    });

    proc.on("close", (code: number | null) => {
      const durationMs = Date.now() - startTime;
      const stderrRaw = Buffer.concat(stderrChunks).toString().trim();

      if (code !== 0) {
        const lastLines = stderrRaw.split("\n").slice(-5).join(" | ");
        log.error(
          { exitCode: code, durationMs, stderr: lastLines, inputPath },
          "FFmpeg exited with non-zero code"
        );
        reject(new Error(`ffmpeg exited with code ${code}`));
        return;
      }

      const fileSize = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0;
      log.info(
        { durationMs, fileSizeBytes: fileSize, inputPath, outputPath },
        "FFmpeg audio extraction complete"
      );
      resolve();
    });
  });
}

export async function GET(request: Request) {
  const reqId = generateReqId();
  const ip = getClientIp(request);
  const ipHash = hashIp(ip);

  return runWithRequestContext(reqId, ipHash, async () => {
    const log = getLog("tiktok-audio");
    const requestStart = Date.now();

    const url = new URL(request.url).searchParams.get("url");

    log.info({ url }, "TikTok audio download request received");

    const guard = guardApiRequest(request);
    if (guard) return guard;

    if (!url) {
      log.warn("Missing url parameter");
      return new Response("Missing url parameter", { status: 400 });
    }

    if (!tiktok_validate(url)) {
      log.warn({ url }, "Invalid TikTok URL");
      return new Response("Invalid TikTok URL", { status: 400 });
    }

    let ffmpegPath: string;
    try {
      ({ ffmpegPath } = await getServerConf());
    } catch (err) {
      log.error({ err }, "Server configuration unavailable");
      return new Response("Server configuration error", { status: 500 });
    }
    if (!ffmpegPath) return new Response("Server configuration error", { status: 500 });

    const timestamp = Date.now();
    const sourcePath = path.join(TEMP_DIR, "source", `tiktok_audio_src_${timestamp}.mp4`);
    const mp3Path = path.join(TEMP_DIR, "source", `tiktok_audio_${timestamp}.mp3`);

    try {
      try {
        await downloadTiktokToFile(url, sourcePath);
      } catch (err) {
        cleanFiles([sourcePath]);
        throw err;
      }

      try {
        await extractAudioWithFfmpeg(ffmpegPath, sourcePath, mp3Path);
      } finally {
        cleanFiles([sourcePath]);
      }

      const fileSizeBytes = fs.existsSync(mp3Path) ? fs.statSync(mp3Path).size : 0;
      const totalMs = Date.now() - requestStart;
      log.info({ url, fileSizeBytes, totalMs }, "Sending TikTok audio response");

      const stream = fs.createReadStream(mp3Path);
      stream.on("close", () => cleanFiles([mp3Path]));

      // biome-ignore lint/suspicious/noExplicitAny: Next.js stream cast
      return new NextResponse(stream as any, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Disposition": buildContentDisposition("tiktok_audio", "mp3"),
        },
      });
    } catch (err) {
      const totalMs = Date.now() - requestStart;
      log.error({ err, url, totalMs }, "TikTok audio extraction failed");
      cleanFiles([mp3Path]);
      return new Response("An error occurred while processing", { status: 500 });
    }
  });
}
