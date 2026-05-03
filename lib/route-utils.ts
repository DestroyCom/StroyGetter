import * as fs from "node:fs";
import path from "node:path";

export const TEMP_DIR = path.join(
  process.env.NODE_ENV === "production" ? "/temp/stroygetter" : "./temp",
);

export function cleanFiles(paths: string[]): void {
  for (const p of paths) {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
}

export function buildContentDisposition(title: string, ext: string): string {
  const safe = encodeURIComponent((title || ext).normalize("NFKD")).replace(
    /[̀-ͯ]/g,
    "",
  );
  return `attachment; filename="${safe}.${ext}"`;
}
