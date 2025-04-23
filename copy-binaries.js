import path from "path";
import fs from "fs";

const sourcePath = path.resolve("./node_modules/youtube-dl-exec/bin/yt-dlp");
const destPath = path.resolve("./.next/server/bin/yt-dlp");

fs.mkdirSync(path.dirname(destPath), { recursive: true });

fs.copyFileSync(sourcePath, destPath);
console.log(`Copied ${sourcePath} to ${destPath}`);
