import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import path from "node:path";
import { create as createYoutubeDl } from "youtube-dl-exec";
import { logger } from "@/lib/logger";
import { initializeCleanup } from "@/scripts/cleanup";

const log = logger.child({ module: "server-utils" });

type Conf = {
  isInitialized: boolean;
  ffmpegPath: string;
};

const PARENT_PATH = process.env.NODE_ENV === "production" ? "/temp/stroygetter" : "./temp";
const TEMP_DIR = path.join(PARENT_PATH);

const createTempDir = (tmp_dir: string) => {
  const dirs = [tmp_dir, path.join(tmp_dir, "cached"), path.join(tmp_dir, "source")];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
      log.debug({ dir }, "Temp directory created");
    }
  }
};

export async function initializeConf(conf: Conf) {
  if (conf.isInitialized) {
    log.warn("initializeConf called but server is already initialised — skipping");
    return conf;
  }

  initializeCleanup();
  createTempDir(TEMP_DIR);

  conf.ffmpegPath = await locateFfmpegPath();
  conf.isInitialized = true;

  return conf;
}

async function locateFfmpegPath(): Promise<string> {
  const detectCommand = os.platform() === "win32" ? "where ffmpeg" : "which ffmpeg";
  try {
    const localPath = execSync(detectCommand).toString().trim();
    if (localPath) {
      log.debug({ ffmpegPath: localPath, source: "system-PATH" }, "FFmpeg located");
      return localPath;
    }
  } catch (err) {
    log.debug(
      { command: detectCommand, err: err instanceof Error ? err.message : String(err) },
      "System FFmpeg lookup failed — falling back to ffmpeg-static"
    );
  }
  const { default: staticPath } = await import("ffmpeg-static");
  if (staticPath) {
    log.debug({ ffmpegPath: staticPath, source: "ffmpeg-static" }, "FFmpeg located");
    return staticPath;
  }
  throw new Error("FFmpeg not found in PATH and ffmpeg-static unavailable");
}

export function sanitizeFilename(filename: string) {
  return (
    filename
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional control char sanitization
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
      .replace(/[​-‍﻿]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 255)
  );
}

const video_id_pattern = /^[a-zA-Z\d_-]{11,12}$/;
const video_pattern =
  /^((?:https?:)?\/\/)?(?:(?:www|m|music)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w-]+\?v=|shorts\/|embed\/|live\/|v\/)?)([\w-]+)(\S+)?$/;
export function yt_validate(url: string): "video" | false {
  let url_ = url.trim();
  if (!url_.startsWith("https")) return false;
  // Strip playlist/radio params so URLs like ?v=ID&list=RD...&start_radio=1 still resolve to a video
  try {
    const parsed = new URL(url_);
    parsed.searchParams.delete("list");
    parsed.searchParams.delete("start_radio");
    parsed.searchParams.delete("index");
    url_ = parsed.toString();
  } catch {
    return false;
  }
  if (url_.match(video_pattern)) {
    let id: string;
    if (url_.includes("youtu.be/")) id = url_.split("youtu.be/")[1].split(/(\?|\/|&)/)[0];
    else if (url_.includes("youtube.com/embed/"))
      id = url_.split("youtube.com/embed/")[1].split(/(\?|\/|&)/)[0];
    else if (url_.includes("youtube.com/shorts/"))
      id = url_.split("youtube.com/shorts/")[1].split(/(\?|\/|&)/)[0];
    else id = url_.split("watch?v=")[1]?.split(/(\?|\/|&)/)[0];
    if (id?.match(video_id_pattern)) return "video";
  }
  return false;
}

const tiktok_video_pattern = /^https:\/\/(www\.)?tiktok\.com\/@[\w.]+\/video\/\d+/;
const tiktok_short_pattern = /^https:\/\/vm\.tiktok\.com\/[\w]+\/?$/;

export function tiktok_validate(url: string): "video" | false {
  const u = url.trim();
  if (tiktok_video_pattern.test(u) || tiktok_short_pattern.test(u)) return "video";
  return false;
}

export function detectSource(url: string): "youtube" | "tiktok" | null {
  if (yt_validate(url)) return "youtube";
  if (tiktok_validate(url)) return "tiktok";
  return null;
}

let _ytdl: ReturnType<typeof createYoutubeDl> | null = null;

export function selectYtDlpPath() {
  if (!_ytdl) {
    const filename = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
    const candidates = [
      path.join(process.cwd(), ".next/server/bin", filename),
      path.join(process.cwd(), "node_modules/youtube-dl-exec/bin", filename),
    ];
    const resolved = candidates.find((p) => fs.existsSync(p));
    if (!resolved) throw new Error(`yt-dlp binary not found. Searched: ${candidates.join(", ")}`);
    log.debug({ ytDlpPath: resolved }, "yt-dlp binary resolved");
    _ytdl = createYoutubeDl(resolved);
  }
  return _ytdl;
}
