import * as fs from "node:fs";
import * as path from "node:path";

let _bin: string | null = null;

export function getYtDlpBinaryPath(): string {
  if (_bin) return _bin;
  const filename = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
  const candidates = [
    path.join(process.cwd(), ".next/server/bin", filename),
    path.join(process.cwd(), "node_modules/youtube-dl-exec/bin", filename),
  ];
  _bin = candidates.find((p) => fs.existsSync(p)) ?? null;
  if (!_bin)
    throw new Error(`yt-dlp not found. Searched: ${candidates.join(", ")}`);
  return _bin;
}
