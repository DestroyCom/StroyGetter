"use server";

import { spawn } from "node:child_process";
import { logger } from "@/lib/logger";
import { getGalleryDlBinaryPath } from "@/lib/gallery-dl-binary";
import type { TikTokPhotoData } from "@/lib/types";

const log = logger.child({ module: "fetch-tiktok-photo-infos" });

type GalleryDlItem = [number, unknown, ...unknown[]];

function runGalleryDlDumpJson(url: string): Promise<GalleryDlItem[]> {
  return new Promise((resolve, reject) => {
    const bin = getGalleryDlBinaryPath();
    const proc = spawn(bin, ["--dump-json", "--no-part", url]);

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    if (proc.stdout) proc.stdout.on("data", (d: Buffer) => stdoutChunks.push(d));
    if (proc.stderr) proc.stderr.on("data", (d: Buffer) => stderrChunks.push(d));

    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error("gallery-dl timed out after 30s"));
    }, 30_000);

    proc.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    proc.on("close", (code) => {
      clearTimeout(timeout);
      const stdout = Buffer.concat(stdoutChunks).toString().trim();
      if (!stdout) {
        const stderr = Buffer.concat(stderrChunks).toString().trim();
        reject(new Error(stderr || "No output from gallery-dl"));
        return;
      }
      try {
        resolve(JSON.parse(stdout) as GalleryDlItem[]);
      } catch {
        reject(new Error("Failed to parse gallery-dl JSON output"));
      }
    });
  });
}

async function resolveItems(url: string): Promise<GalleryDlItem[]> {
  const items = await runGalleryDlDumpJson(url);
  // Type-6 item = URL redirect (short URLs like vm.tiktok.com resolve to canonical)
  const redirect = items.find(
    (item): item is [6, string, unknown] =>
      Array.isArray(item) && item[0] === 6 && typeof item[1] === "string"
  );
  if (redirect) {
    return runGalleryDlDumpJson(redirect[1]);
  }
  return items;
}

export async function getTikTokPhotoInfos(url: string): Promise<TikTokPhotoData | { error: string }> {
  log.info({ url }, "Fetching TikTok photo post via gallery-dl");
  const startTime = Date.now();

  let items: GalleryDlItem[];
  try {
    items = await resolveItems(url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "gallery-dl failed";
    log.error({ url, err, durationMs: Date.now() - startTime }, `gallery-dl error: ${msg}`);
    return { error: msg };
  }

  // Find the first type-2 item that has imagePost data (the full post metadata)
  const postEntry = items.find(
    (item): item is [2, Record<string, unknown>] =>
      Array.isArray(item) &&
      item[0] === 2 &&
      typeof item[1] === "object" &&
      item[1] !== null &&
      "imagePost" in item[1]
  );

  if (!postEntry) {
    log.warn({ url, itemCount: items.length }, "No photo post found in gallery-dl output");
    return { error: "No photo post data found" };
  }

  // biome-ignore lint/suspicious/noExplicitAny: raw TikTok API shape
  const data = postEntry[1] as any;

  const images = (data.imagePost.images as unknown[]).map((img: unknown) => {
    // biome-ignore lint/suspicious/noExplicitAny: raw TikTok API shape
    const image = img as any;
    return {
      url: image.imageURL.urlList[0] as string,
      width: image.imageWidth as number,
      height: image.imageHeight as number,
    };
  });

  const thumbnail: string =
    data.imagePost?.cover?.imageURL?.urlList?.[0] ?? images[0]?.url ?? "";

  log.info(
    { url, imageCount: images.length, durationMs: Date.now() - startTime },
    "TikTok photo post fetched successfully"
  );

  return {
    type: "photo",
    images,
    video_details: {
      title: (data.desc as string | undefined) ?? "",
      author:
        (data.author?.nickname as string | undefined) ??
        (data.author?.uniqueId as string | undefined) ??
        "",
      thumbnail,
    },
  };
}
