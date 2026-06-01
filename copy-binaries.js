/**
 * copy-binaries.js — postbuild hook for LOCAL standalone usage only.
 *
 * Copies yt-dlp and gallery-dl into .next/server/bin/ so that `pnpm start`
 * can find them via their respective binary resolver modules.
 *
 * NOT needed by Docker: both binaries are installed via pip3 in the runner stage.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const binDir = path.resolve("./.next/server/bin");
fs.mkdirSync(binDir, { recursive: true });

// ── yt-dlp ──────────────────────────────────────────────────────────────────
const ytdlpSrc = path.resolve("./node_modules/youtube-dl-exec/bin/yt-dlp");
const ytdlpDest = path.join(binDir, "yt-dlp");
fs.copyFileSync(ytdlpSrc, ytdlpDest);
console.log(`Copied yt-dlp → ${ytdlpDest}`);

// ── gallery-dl ───────────────────────────────────────────────────────────────
let galleryDlSrc = null;
try {
  galleryDlSrc = execSync("which gallery-dl", { stdio: ["pipe", "pipe", "pipe"] })
    .toString()
    .trim();
} catch {
  console.warn("gallery-dl not found in PATH — skipping copy. Run: pip3 install gallery-dl");
}
if (galleryDlSrc) {
  const galleryDlDest = path.join(binDir, "gallery-dl");
  fs.copyFileSync(galleryDlSrc, galleryDlDest);
  console.log(`Copied gallery-dl → ${galleryDlDest}`);
}
