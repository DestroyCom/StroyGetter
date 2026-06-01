import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

let _bin: string | null = null;

export function getGalleryDlBinaryPath(): string {
  if (_bin) return _bin;

  const candidates = [path.join(process.cwd(), ".next/server/bin/gallery-dl")];
  _bin = candidates.find((p) => fs.existsSync(p)) ?? null;

  if (!_bin) {
    // Dev fallback: resolve from PATH
    try {
      const detectCommand = process.platform === "win32" ? "where gallery-dl" : "which gallery-dl";
      const resolved = execSync(detectCommand, { stdio: ["pipe", "pipe", "pipe"] })
        .toString()
        .split(/\r?\n/)[0]
        .trim();
      if (resolved && fs.existsSync(resolved)) _bin = resolved;
    } catch {}
  }

  if (!_bin)
    throw new Error("gallery-dl not found. Run: pip3 install gallery-dl==1.32.1");
  return _bin;
}
