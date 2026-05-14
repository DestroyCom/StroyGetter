import { spawn } from "node:child_process";
import { getYtDlpBinaryPath } from "@/lib/ytdlp-binary";
import type { FormatData } from "@/lib/types";

type RawFormat = {
  format_id: string;
  height?: number;
  format_note?: string;
  vcodec?: string;
  acodec?: string;
};

const YT_DLP_INFO_ARGS = [
  "--dump-json",
  "--no-warnings",
  "--no-check-certificates",
  "--add-header",
  "referer:youtube.com",
  "--add-header",
  "user-agent:googlebot",
  "--extractor-args",
  "youtube:player_client=tv_embedded",
];

function runYtDlpDumpJson(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const bin = getYtDlpBinaryPath();
    console.log("[ytdlp-info] Running:", bin, [...YT_DLP_INFO_ARGS, url].join(" "));

    const proc = spawn(bin, [...YT_DLP_INFO_ARGS, url]);

    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d: Buffer) => {
      stdout += d.toString();
    });
    proc.stderr.on("data", (d: Buffer) => {
      stderr += d.toString();
    });

    proc.on("close", (code) => {
      if (stderr) console.warn("[ytdlp-info] stderr:", stderr.trim());
      if (code !== 0) {
        reject(new Error(stderr.trim() || `yt-dlp exited with code ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error("Failed to parse yt-dlp JSON output"));
      }
    });
    proc.on("error", reject);
  });
}

export async function getVideoFormats(url: string): Promise<FormatData[]> {
  const info = await runYtDlpDumpJson(url);
  const rawFormats = (info as { formats?: RawFormat[] }).formats ?? [];

  const seen = new Set<string>();
  const formats = rawFormats
    .filter((f) => f.vcodec?.startsWith("avc") && f.acodec === "none" && f.height)
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0))
    .reduce<FormatData[]>((acc, f) => {
      const itag = parseInt(f.format_id, 10);
      if (!Number.isFinite(itag)) return acc;
      const label = f.format_note || `${f.height}p`;
      if (!seen.has(label)) {
        seen.add(label);
        acc.push({ itag, qualityLabel: label });
      }
      return acc;
    }, []);

  console.log(
    "[ytdlp-info] Formats found:",
    formats.length ? formats.map((f) => `${f.qualityLabel}(${f.itag})`).join(", ") : "none"
  );
  return formats;
}
