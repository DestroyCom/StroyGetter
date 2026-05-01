import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import path from "node:path";
import { create as createYoutubeDl } from "youtube-dl-exec";
import { initializeCleanup } from "@/scripts/cleanup";

type Conf = {
  isInitialized: boolean;
  ffmpegPath: string;
};

const PARENT_PATH = process.env.NODE_ENV === "production" ? "/temp/stroygetter" : "./temp";
const TEMP_DIR = path.join(PARENT_PATH);

const createTempDir = (tmp_dir: string) => {
  if (!fs.existsSync(tmp_dir)) {
    fs.mkdirSync(tmp_dir);
  }
  if (!fs.existsSync(path.join(tmp_dir, "cached"))) {
    fs.mkdirSync(path.join(tmp_dir, "cached"));
  }
  if (!fs.existsSync(path.join(tmp_dir, "source"))) {
    fs.mkdirSync(path.join(tmp_dir, "source"));
  }
};

export async function initializeConf(conf: Conf) {
  if (conf.isInitialized) {
    console.log("Server configuration already initialized.");
    return conf;
  }

  initializeCleanup();
  createTempDir(TEMP_DIR);

  conf.ffmpegPath = await locateFfmpegPath();
  conf.isInitialized = true;
  console.log("Server configuration initialized.");

  return conf;
}


async function locateFfmpegPath(): Promise<string> {
  try {
    const detectCommand = os.platform() === "win32" ? "where ffmpeg" : "which ffmpeg";
    const localPath = execSync(detectCommand).toString().trim();
    if (localPath) return localPath;
  } catch {}
  const { default: staticPath } = await import("ffmpeg-static");
  if (staticPath) return staticPath;
  throw new Error("FFmpeg not found in PATH and ffmpeg-static unavailable");
}

export function sanitizeFilename(filename: string) {
  return (
    filename
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional control char sanitization
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 255)
  );
}

const video_id_pattern = /^[a-zA-Z\d_-]{11,12}$/;
const video_pattern =
  /^((?:https?:)?\/\/)?(?:(?:www|m|music)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w-]+\?v=|shorts\/|embed\/|live\/|v\/)?)([\w-]+)(\S+)?$/;
export function yt_validate(url: string): "video" | false {
  const url_ = url.trim();
  if (url_.indexOf("list=") === -1) {
    if (url_.startsWith("https")) {
      if (url_.match(video_pattern)) {
        let id: string;
        if (url_.includes("youtu.be/")) id = url_.split("youtu.be/")[1].split(/(\?|\/|&)/)[0];
        else if (url_.includes("youtube.com/embed/"))
          id = url_.split("youtube.com/embed/")[1].split(/(\?|\/|&)/)[0];
        else if (url_.includes("youtube.com/shorts/"))
          id = url_.split("youtube.com/shorts/")[1].split(/(\?|\/|&)/)[0];
        else id = url_.split("watch?v=")[1]?.split(/(\?|\/|&)/)[0];
        if (id?.match(video_id_pattern)) return "video";
        else return false;
      } else return false;
    }
  }
  return false;
}

let _ytdl: ReturnType<typeof createYoutubeDl> | null = null;

export function selectYtDlpPath() {
  if (!_ytdl) {
    const binaryPath = path.join(process.cwd(), "node_modules/youtube-dl-exec/bin/yt-dlp");
    _ytdl = createYoutubeDl(binaryPath);
  }
  return _ytdl;
}
