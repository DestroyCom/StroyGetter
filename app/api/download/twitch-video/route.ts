import { spawn } from "node:child_process";
import * as fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { trackServer } from "@/lib/analytics-server";
import { getClientIp, guardApiRequest } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";
import { generateReqId, getLog, hashIp, runWithRequestContext } from "@/lib/request-context";
import { buildContentDisposition, cleanFiles, TEMP_DIR } from "@/lib/route-utils";
import { getServerConf } from "@/lib/server-conf";
import { sanitizeDownloadTitle, sanitizeFilename, twitch_validate } from "@/lib/serverUtils";
import { getYtDlpBinaryPath } from "@/lib/ytdlp-binary";
import { getCookiesArgs } from "@/lib/ytdlp-cookies";

const DOWNLOAD_TIMEOUT_MS = 5 * 60 * 1000;
const MAX_FILESIZE = process.env.MAX_FILESIZE ?? "8G";

const _inFlight = new Map<string, Promise<string>>();

function downloadTwitchToFile(
  url: string,
  formatSelector: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const log = getLog("twitch-download");
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
      formatSelector,
      "-o",
      outputPath,
      url,
    ];

    log.info({ url, formatSelector, outputPath }, "Starting yt-dlp Twitch download");
    const startTime = Date.now();

    const proc = spawn(bin, args);

    const stderrChunks: Buffer[] = [];
    if (proc.stderr) {
      proc.stderr.on("data", (d: Buffer) => stderrChunks.push(d));
    }

    const timeout = setTimeout(() => {
      proc.kill();
      log.error({ url, formatSelector, timeoutMs: DOWNLOAD_TIMEOUT_MS }, "yt-dlp timed out");
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
          { exitCode: code, durationMs, stderr: lastLines, url, formatSelector },
          "yt-dlp exited with non-zero code"
        );
        reject(new Error(`yt-dlp exited with code ${code}`));
        return;
      }

      const fileSize = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0;
      log.info(
        { durationMs, fileSizeBytes: fileSize, url, formatSelector },
        "yt-dlp download complete"
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
    const log = getLog("twitch-video");
    const requestStart = Date.now();

    const params = new URL(request.url).searchParams;
    const url = params.get("url");
    const quality = params.get("quality");

    log.info({ url, quality }, "Twitch video download request received");

    const guard = guardApiRequest(request);
    if (guard) return guard;

    if (!url) {
      log.warn("Missing url parameter");
      return new Response("Missing url parameter", { status: 400 });
    }
    if (!quality) {
      log.warn({ url }, "Missing quality parameter");
      return new Response("Missing quality parameter", { status: 400 });
    }

    if (!twitch_validate(url)) {
      log.warn({ url }, "Invalid Twitch URL");
      return new Response("Invalid Twitch URL", { status: 400 });
    }

    // Strict allowlist: Twitch format IDs are alphanumeric + underscores + dots + hyphens
    // e.g. "720p60", "1080p60__source", "480p". Rejects path traversal and shell injection.
    if (!/^[A-Za-z0-9_.-]{1,64}$/.test(quality)) {
      log.warn({ quality }, "Invalid quality parameter — rejected by allowlist");
      return new Response("Invalid quality value", { status: 400 });
    }

    await getServerConf(); // side-effect only: initialises temp dirs and cleanup cron

    // quality is the formatId string directly (e.g. "720p60", "1080p60__source")
    const qualityLabel = quality;
    // Cap at 180 chars (formatId can be longer than a numeric itag)
    const sanitizedUrl = sanitizeFilename(url).slice(0, 180);
    const cachedName = `twitch_${sanitizedUrl}_${quality}.mp4`;
    const outputPath = path.join(TEMP_DIR, "cached", cachedName);
    const cacheKey = `${url}:${qualityLabel}`;

    // Build download filename from title param or fallback
    const titleParam = params.get("title");
    const downloadFilename = titleParam ? sanitizeDownloadTitle(titleParam) : "Twitch_Video";

    // Keep the internal cache title simple
    const title = titleParam ?? "Twitch Video";

    let cacheHit = false;
    const resolveFilePath = async (): Promise<string> => {
      // Check DB cache first
      const cached = await prisma.file.findFirst({
        where: { video: { url }, quality: qualityLabel },
      });
      if (cached && fs.existsSync(cached.path)) {
        log.info({ cacheKey, filePath: cached.path }, "Cache hit — serving existing file");
        cacheHit = true;
        return cached.path;
      }
      if (cached && !fs.existsSync(cached.path)) {
        log.warn(
          { cacheKey, filePath: cached.path },
          "Stale DB cache entry — file missing on disk, re-downloading"
        );
        await prisma.file.delete({ where: { id: cached.id } }).catch((err) => {
          log.warn({ err, fileId: cached.id }, "Failed to delete stale file entry — continuing");
        });
      } else {
        log.debug({ cacheKey }, "Cache miss — starting Twitch download");
      }

      // Use a unique temp path during download, then keep as cached path
      const outputFilename = `twitch_${sanitizedUrl}_${quality}_${Date.now()}.mp4`;
      const tempDownloadPath = path.join(TEMP_DIR, "source", outputFilename);

      try {
        await downloadTwitchToFile(url, quality, tempDownloadPath);
      } catch (err) {
        cleanFiles([tempDownloadPath]);
        throw err;
      }

      // Move from source to cached
      fs.renameSync(tempDownloadPath, outputPath);

      try {
        await prisma.file.create({
          data: {
            path: outputPath,
            quality: qualityLabel,
            video: {
              connectOrCreate: {
                where: { url },
                create: { title, url },
              },
            },
          },
        });
        log.debug({ outputPath, qualityLabel }, "File record saved to DB");
      } catch (dbErr) {
        log.warn({ err: dbErr, outputPath }, "Failed to save file record to DB");
      }

      return outputPath;
    };

    // Deduplicate concurrent requests for the same URL+quality
    let pending = _inFlight.get(cacheKey);
    if (!pending) {
      log.debug({ cacheKey }, "No in-flight download — starting new one");
      pending = resolveFilePath().finally(() => _inFlight.delete(cacheKey));
      _inFlight.set(cacheKey, pending);
    } else {
      log.info({ cacheKey }, "Joining existing in-flight download");
    }

    try {
      const filePath = await pending;
      const fileSizeBytes = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
      const totalMs = Date.now() - requestStart;

      log.info({ cacheKey, filePath, fileSizeBytes, totalMs }, "Sending Twitch video response");

      void trackServer(
        "download_completed",
        { source: "twitch", format: "twitch-video", title, quality, cache_hit: cacheHit, file_size_bytes: fileSizeBytes, total_ms: totalMs },
        { url: "/api/download/twitch-video", userAgent: request.headers.get("user-agent") ?? undefined, language: request.headers.get("accept-language")?.split(",")[0] ?? undefined },
      );

      const stream = fs.createReadStream(filePath);

      // biome-ignore lint/suspicious/noExplicitAny: Next.js stream cast
      return new NextResponse(stream as any, {
        headers: {
          "Content-Type": "video/mp4",
          "Content-Disposition": buildContentDisposition(downloadFilename, "mp4"),
        },
      });
    } catch (err) {
      const totalMs = Date.now() - requestStart;
      log.error({ err, url, quality, totalMs }, "Twitch video download failed");
      return new Response("An error occurred while processing", { status: 500 });
    }
  });
}
