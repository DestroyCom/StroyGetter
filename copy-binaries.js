/**
 * copy-binaries.js — postbuild hook for LOCAL standalone usage only.
 *
 * Copies the yt-dlp binary into .next/server/bin/ so that `pnpm start`
 * (Next.js standalone server run locally, not via Docker) can find it via
 * selectYtDlpPath()'s first candidate: path.join(cwd, '.next/server/bin', …).
 *
 * NOT needed by Docker: yt-dlp (and similar Python-installed binaries) are
 * installed in the Dockerfile's runner stage via pip3, so they land outside
 * .next/standalone/ and are never copied into the Docker image by this script.
 */
import fs from "node:fs";
import path from "node:path";

const sourcePath = path.resolve("./node_modules/youtube-dl-exec/bin/yt-dlp");
const destPath = path.resolve("./.next/server/bin/yt-dlp");

fs.mkdirSync(path.dirname(destPath), { recursive: true });

fs.copyFileSync(sourcePath, destPath);
console.log(`Copied ${sourcePath} to ${destPath}`);
