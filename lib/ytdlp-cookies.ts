import * as fs from "node:fs";

/**
 * Returns ["--cookies", "<path>"] when COOKIES_PATH is set and the file exists,
 * otherwise returns [].
 *
 * Mount a Netscape-format cookies.txt (exported from your browser while logged
 * into YouTube) at the path pointed to by COOKIES_PATH.  yt-dlp will use it to
 * bypass age-restricted / members-only videos.
 *
 * See https://github.com/yt-dlp/yt-dlp/wiki/FAQ#how-do-i-pass-cookies-to-yt-dlp
 */
export function getCookiesArgs(): string[] {
  const p = process.env.COOKIES_PATH;
  if (!p) return [];
  if (!fs.existsSync(p)) return [];
  return ["--cookies", p];
}

/**
 * Returns { cookies: "<path>" } for use with the youtube-dl-exec option object,
 * or {} when no valid cookies file is configured.
 */
export function getCookiesOpt(): { cookies?: string } {
  const p = process.env.COOKIES_PATH;
  if (!p) return {};
  if (!fs.existsSync(p)) return {};
  return { cookies: p };
}
