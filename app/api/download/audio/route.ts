"use server";

import * as fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { downloadAudioWithFfmpegTags } from "@/lib/audio-convert";
import { extractVideoId, getInnertube } from "@/lib/innertube";
import { guardApiRequest } from "@/lib/api-guard";
import { getServerConf } from "@/lib/server-conf";
import { TEMP_DIR, buildContentDisposition, cleanFiles } from "@/lib/route-utils";

export async function GET(request: Request) {
  const guard = guardApiRequest(request);
  if (guard) return guard;

  const url = new URL(request.url).searchParams.get("url");
  if (!url) return new Response("Missing url parameter", { status: 400 });

  const { ffmpegPath } = await getServerConf();
  if (!ffmpegPath) return new Response("Server configuration error", { status: 500 });

  const videoId = extractVideoId(url);
  if (!videoId) return new Response("Invalid YouTube URL", { status: 400 });

  const innertube = await getInnertube();
  const info = (await innertube.getBasicInfo(videoId)).basic_info;

  const title = info.title ?? "Unknown title";
  const artist = info.author ?? "Unknown artist";

  const thumbnails = info.thumbnail ?? [];
  const bestThumb = thumbnails.reduce(
    (best, t) => ((t.width ?? 0) > (best.width ?? 0) ? t : best),
    thumbnails[0] ?? { url: "" },
  );

  const thumbPath = path.join(TEMP_DIR, "source", `thumb_${videoId}.jpg`);
  let hasThumb = false;
  if (bestThumb?.url) {
    try {
      const res = await fetch(bestThumb.url);
      if (res.ok) {
        await fs.promises.writeFile(thumbPath, Buffer.from(await res.arrayBuffer()));
        hasThumb = true;
      }
    } catch {
      // proceed without cover
    }
  }

  const mp3Path = path.join(TEMP_DIR, "source", `audio_${videoId}_${Date.now()}.mp3`);

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
  } finally {
    if (hasThumb) cleanFiles([thumbPath]);
  }

  const stream = fs.createReadStream(mp3Path);
  stream.on("close", () => cleanFiles([mp3Path]));

  // biome-ignore lint/suspicious/noExplicitAny: Next.js stream cast
  return new NextResponse(stream as any, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Disposition": buildContentDisposition(title, "mp3"),
    },
  });
}
