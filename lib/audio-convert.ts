import { spawn } from "node:child_process";
import { getYtDlpBinaryPath } from "@/lib/ytdlp-binary";

const MAX_FILESIZE = process.env.MAX_FILESIZE ?? "8G";

const YT_DLP_FLAGS = [
  "--no-check-certificates",
  "--no-warnings",
  "--max-filesize", MAX_FILESIZE,
  "--add-header", "referer:youtube.com",
  "--add-header", "user-agent:googlebot",
  "-f", "ba",
  "-o", "-",
];

function spawnFfmpeg(ffmpegPath: string, args: string[]) {
  return spawn(ffmpegPath, args);
}

/** Plain audio download → MP3 (no tags). Used by the library-ready pipeline. */
export async function downloadAndConvertToMp3(
  url: string,
  mp3OutPath: string,
  ffmpegPath: string,
): Promise<void> {
  const ytDlpBin = getYtDlpBinaryPath();

  await new Promise<void>((resolve, reject) => {
    const ytdlProc = spawn(ytDlpBin, [...YT_DLP_FLAGS, url]);
    const ffmpegProc = spawnFfmpeg(ffmpegPath, [
      "-i", "pipe:0",
      "-codec:a", "libmp3lame",
      "-q:a", "2",
      "-y", mp3OutPath,
    ]);

    ytdlProc.stdout.pipe(ffmpegProc.stdin);
    ffmpegProc.stderr.on("data", (d: Buffer) => process.stdout.write(d));
    ytdlProc.stderr.on("data", (d: Buffer) => process.stdout.write(d));
    ytdlProc.on("error", reject);
    ffmpegProc.on("error", reject);
    ffmpegProc.on("close", (code) => {
      if (code !== 0) reject(new Error(`ffmpeg exited with code ${code}`));
      else resolve();
    });
  });
}

export interface AudioFfmpegTags {
  title: string;
  artist: string;
  year: string;
  genre: string;
  album: string;
}

/**
 * Audio download → MP3 with optional cover art + ID3 metadata embedded via
 * ffmpeg. Used by the basic audio route.
 */
export async function downloadAudioWithFfmpegTags(
  url: string,
  mp3OutPath: string,
  ffmpegPath: string,
  opts: { thumbPath?: string; tags?: AudioFfmpegTags } = {},
): Promise<void> {
  const { thumbPath, tags } = opts;
  const ytDlpBin = getYtDlpBinaryPath();

  const ffmpegArgs: string[] = [
    "-i", "pipe:0",
    ...(thumbPath ? ["-i", thumbPath] : []),
    "-map", "0:a",
    ...(thumbPath ? ["-map", "1:0"] : []),
    "-codec:a", "libmp3lame",
    "-q:a", "2",
    ...(thumbPath
      ? [
          "-id3v2_version", "3",
          "-metadata:s:v", "title=Album cover",
          "-metadata:s:v", "comment=Cover (front)",
        ]
      : []),
    ...(tags
      ? [
          "-metadata", `title=${tags.title}`,
          "-metadata", `artist=${tags.artist}`,
          "-metadata", `year=${tags.year}`,
          "-metadata", `genre=${tags.genre}`,
          "-metadata", `album=${tags.album}`,
        ]
      : []),
    "-y", mp3OutPath,
  ];

  await new Promise<void>((resolve, reject) => {
    const ytdlProc = spawn(ytDlpBin, [...YT_DLP_FLAGS, url]);
    const ffmpegProc = spawnFfmpeg(ffmpegPath, ffmpegArgs);

    ytdlProc.stdout.pipe(ffmpegProc.stdin);
    ffmpegProc.stderr.on("data", (d: Buffer) => process.stdout.write(d));
    ytdlProc.stderr.on("data", (d: Buffer) => process.stdout.write(d));
    ytdlProc.on("error", reject);
    ffmpegProc.on("error", reject);
    ffmpegProc.on("close", (code) => {
      if (code !== 0) reject(new Error(`ffmpeg exited with code ${code}`));
      else resolve();
    });
  });
}
