"use server";
import { execSync } from "child_process";
import * as os from "os";

export async function detectFfmpegCapabilities() {
  if (!(await detectNvidiaGpuAvailable())) {
    return false;
  }

  const hwaccelOutput = execSync("ffmpeg -hwaccels").toString();

  const hasCuda =
    hwaccelOutput.includes("cuda") || hwaccelOutput.includes("nvenc");

  if (!hasCuda) {
    console.warn("CUDA or NVENC not detected in hardware acceleration output.");
  }

  return hasCuda;
}

export async function detectNvidiaGpuAvailable() {
  try {
    execSync("nvidia-smi");
    return true;
  } catch {
    console.error("NVIDIA GPU not found");
    return false;
  }
}

export async function detectOs() {
  return os.platform();
}

export async function locateFfmpegPath() {
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
