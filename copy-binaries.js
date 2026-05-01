import fs from "node:fs";
import path from "node:path";

const sourcePath = path.resolve("./node_modules/youtube-dl-exec/bin/yt-dlp");
const destPath = path.resolve("./.next/server/bin/yt-dlp");

fs.mkdirSync(path.dirname(destPath), { recursive: true });

fs.copyFileSync(sourcePath, destPath);
console.log(`Copied ${sourcePath} to ${destPath}`);
