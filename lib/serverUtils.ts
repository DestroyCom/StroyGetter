"use server";
import { execSync } from "child_process";
import * as os from "os";
import * as fs from "fs";
import path from "path";
import { initializeCleanup } from "@/scripts/cleanup";

type Conf = {
  isInitialized: boolean;
  ffmpegPath: string;
  hasNvidiaCapabilities: boolean;
};

const PARENT_PATH =
  process.env.NODE_ENV === "production" ? "/temp/stroygetter" : "./temp";
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
  conf.hasNvidiaCapabilities = await detectFfmpegCapabilities();
  conf.isInitialized = true;
  console.log("Server configuration initialized.");

  return conf;
}

async function detectFfmpegCapabilities() {
  if (!(await detectNvidiaGpuAvailable())) {
    return false;
  }

  const hwaccelOutput = execSync("ffmpeg -hwaccels").toString();

  const hasCuda =
    hwaccelOutput.includes("cuda") || hwaccelOutput.includes("nvenc");

  if (!hasCuda) {
    console.warn("CUDA or NVENC not detected in hardware acceleration output.");
  }
  console.log("CUDA or NVENC detected in hardware acceleration output.");

  return hasCuda;
}

async function detectNvidiaGpuAvailable() {
  try {
    execSync("nvidia-smi");
    return true;
  } catch {
    console.error("nvidia-smi not found. NVIDIA GPU not available.");
    return false;
  }
}

async function locateFfmpegPath() {
  const detectCommand =
    os.platform() === "win32" ? "where ffmpeg" : "which ffmpeg";

  const localPath = execSync(detectCommand).toString().trim();

  return localPath;
}

export async function sanitizeFilename(filename: string) {
  return filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"\/\\|?*\x00-\x1F]/g, "_")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 255);
}

const video_id_pattern = /^[a-zA-Z\d_-]{11,12}$/;
const video_pattern =
  /^((?:https?:)?\/\/)?(?:(?:www|m|music)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|shorts\/|embed\/|live\/|v\/)?)([\w\-]+)(\S+)?$/;
export async function yt_validate(url: string): Promise<"video" | false> {
  const url_ = url.trim();
  if (url_.indexOf("list=") === -1) {
    if (url_.startsWith("https")) {
      if (url_.match(video_pattern)) {
        let id: string;
        if (url_.includes("youtu.be/"))
          id = url_.split("youtu.be/")[1].split(/(\?|\/|&)/)[0];
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
