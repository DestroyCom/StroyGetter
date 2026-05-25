import * as fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getClientIp, guardApiRequest } from "@/lib/api-guard";
import { downloadAudioWithFfmpegTags } from "@/lib/audio-convert";
import { extractVideoId, getInnertube } from "@/lib/innertube";
import { generateReqId, getLog, hashIp, runWithRequestContext } from "@/lib/request-context";
import { buildContentDisposition, cleanFiles, TEMP_DIR } from "@/lib/route-utils";
import { getServerConf } from "@/lib/server-conf";

export async function GET(request: Request) {
  const reqId = generateReqId();
  const ip = getClientIp(request);
  const ipHash = hashIp(ip);

  return runWithRequestContext(reqId, ipHash, async () => {
    const log = getLog("audio");
    const requestStart = Date.now();

    const url = new URL(request.url).searchParams.get("url");

    log.info({ url }, "Audio download request received");

    const guard = guardApiRequest(request);
    if (guard) return guard;

    if (!url) {
      log.warn("Missing url parameter");
      return new Response("Missing url parameter", { status: 400 });
    }

    let ffmpegPath: string;
    try {
      ({ ffmpegPath } = await getServerConf());
    } catch (err) {
      log.error({ err }, "Server configuration unavailable");
      return new Response("Server configuration error", { status: 500 });
    }
    if (!ffmpegPath) return new Response("Server configuration error", { status: 500 });

    const videoId = extractVideoId(url);
    if (!videoId) {
      log.warn({ url }, "Invalid YouTube URL — could not extract video ID");
      return new Response("Invalid YouTube URL", { status: 400 });
    }

    log.debug({ videoId }, "Fetching innertube basicInfo");
    const innertube = await getInnertube();
    const info = (await innertube.getBasicInfo(videoId)).basic_info;

    const title = info.title ?? "Unknown title";
    const artist = info.author ?? "Unknown artist";
    const durationSec = info.duration ?? 0;

    log.debug({ videoId, title, artist, durationSec }, "Video info resolved");

    const thumbnails = info.thumbnail ?? [];
    const bestThumb = thumbnails.reduce(
      (best, t) => ((t.width ?? 0) > (best.width ?? 0) ? t : best),
      thumbnails[0] ?? { url: "" }
    );

    const thumbPath = path.join(TEMP_DIR, "source", `thumb_${videoId}.jpg`);
    let hasThumb = false;
    if (bestThumb?.url) {
      try {
        const res = await fetch(bestThumb.url);
        if (res.ok) {
          await fs.promises.writeFile(thumbPath, Buffer.from(await res.arrayBuffer()));
          hasThumb = true;
          log.debug({ videoId, thumbUrl: bestThumb.url }, "Thumbnail fetched");
        } else {
          log.warn(
            { videoId, thumbUrl: bestThumb.url, status: res.status },
            "Thumbnail fetch returned non-OK status — continuing without cover"
          );
        }
      } catch (err) {
        log.warn(
          { videoId, thumbUrl: bestThumb.url, err },
          "Thumbnail fetch failed — continuing without cover"
        );
      }
    } else {
      log.debug({ videoId }, "No thumbnail available");
    }

    const mp3Path = path.join(TEMP_DIR, "source", `audio_${videoId}_${Date.now()}.mp3`);

    try {
      try {
        await downloadAudioWithFfmpegTags(url, mp3Path, ffmpegPath, {
          thumbPath: hasThumb ? thumbPath : undefined,
          tags: {
            title,
            artist,
            year: new Date().getFullYear().toString(),
            genre: "Unknown",
            album: title,
          },
        });
      } catch (err) {
        cleanFiles([mp3Path]);
        throw err;
      } finally {
        if (hasThumb) cleanFiles([thumbPath]);
      }

      const fileSizeBytes = fs.existsSync(mp3Path) ? fs.statSync(mp3Path).size : 0;
      const totalMs = Date.now() - requestStart;
      log.info({ videoId, title, fileSizeBytes, totalMs, hasThumb }, "Sending audio response");

      const stream = fs.createReadStream(mp3Path);
      stream.on("close", () => cleanFiles([mp3Path]));

      // biome-ignore lint/suspicious/noExplicitAny: Next.js stream cast
      return new NextResponse(stream as any, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Disposition": buildContentDisposition(title, "mp3"),
        },
      });
    } catch (err) {
      const totalMs = Date.now() - requestStart;
      log.error({ err, url, videoId, totalMs }, "Audio download failed");
      return new Response("An error occurred while processing", { status: 500 });
    }
  });
}
