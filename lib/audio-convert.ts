import { spawn } from "node:child_process";
import { getLog } from "@/lib/request-context";
import { getYtDlpBinaryPath } from "@/lib/ytdlp-binary";

const MAX_FILESIZE = process.env.MAX_FILESIZE ?? "8G";

const YT_DLP_FLAGS = [
  "--no-check-certificates",
  "--no-warnings",
  "--no-playlist",
  "--max-filesize",
  MAX_FILESIZE,
  "--add-header",
  "referer:youtube.com",
  "--add-header",
  "user-agent:googlebot",
  "-f",
  "ba",
  "-o",
  "-",
];

function spawnFfmpeg(ffmpegPath: string, args: string[]) {
  return spawn(ffmpegPath, args);
}

/**
 * Collect stderr from a process and emit structured log lines.
 * `label` identifies which process (yt-dlp / ffmpeg).
 * Lines starting with common progress prefixes are emitted as debug,
 * error-like lines as warn/error.
 */
function logProcessStderr(
  stream: NodeJS.ReadableStream,
  label: string,
  log: ReturnType<typeof getLog>
) {
  const chunks: Buffer[] = [];
  stream.on("data", (d: Buffer) => chunks.push(d));
  stream.on("end", () => {
    const raw = Buffer.concat(chunks).toString().trim();
    if (!raw) return;
    const lines = raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    for (const line of lines) {
      // FFmpeg progress noise — skip or trace
      if (/^(frame=|size=|time=|speed=|bitrate=|video:)/.test(line)) {
        log.trace({ proc: label, raw: line }, "ffmpeg progress");
        continue;
      }
      // yt-dlp download progress — skip
      if (/^\[download\]/.test(line)) {
        continue;
      }
      if (/error/i.test(line)) {
        log.error({ proc: label, raw: line }, `${label} stderr error`);
      } else if (/warn/i.test(line)) {
        log.warn({ proc: label, raw: line }, `${label} stderr warning`);
      } else {
        log.debug({ proc: label, raw: line }, `${label} stderr`);
      }
    }
  });
}

/** Plain audio download → MP3 (no tags). Used by the library-ready pipeline. */
export async function downloadAndConvertToMp3(
  url: string,
  mp3OutPath: string,
  ffmpegPath: string
): Promise<void> {
  const log = getLog("audio-convert");
  const ytDlpBin = getYtDlpBinaryPath();
  const startTime = Date.now();

  log.info(
    { url, outPath: mp3OutPath, fn: "downloadAndConvertToMp3" },
    "Starting yt-dlp → ffmpeg MP3 conversion"
  );

  await new Promise<void>((resolve, reject) => {
    const ytdlProc = spawn(ytDlpBin, [...YT_DLP_FLAGS, url]);
    const ffmpegProc = spawnFfmpeg(ffmpegPath, [
      "-i",
      "pipe:0",
      "-codec:a",
      "libmp3lame",
      "-q:a",
      "2",
      "-y",
      mp3OutPath,
    ]);

    ytdlProc.stdout.pipe(ffmpegProc.stdin);
    logProcessStderr(ytdlProc.stderr, "yt-dlp", log);
    logProcessStderr(ffmpegProc.stderr, "ffmpeg", log);
    ytdlProc.on("error", (err) => {
      log.error({ err }, "yt-dlp process error");
      reject(err);
    });
    ffmpegProc.on("error", (err) => {
      log.error({ err }, "ffmpeg process error");
      reject(err);
    });
    ffmpegProc.on("close", (code) => {
      if (code !== 0) {
        log.error({ exitCode: code, url }, "ffmpeg exited with non-zero code");
        reject(new Error(`ffmpeg exited with code ${code}`));
      } else {
        log.info({ url, durationMs: Date.now() - startTime }, "MP3 conversion complete");
        resolve();
      }
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
  opts: { thumbPath?: string; tags?: AudioFfmpegTags } = {}
): Promise<void> {
  const log = getLog("audio-convert");
  const { thumbPath, tags } = opts;
  const ytDlpBin = getYtDlpBinaryPath();
  const startTime = Date.now();

  log.info(
    {
      url,
      outPath: mp3OutPath,
      hasThumb: !!thumbPath,
      hasTags: !!tags,
      fn: "downloadAudioWithFfmpegTags",
    },
    "Starting yt-dlp → ffmpeg MP3 conversion with tags"
  );

  const ffmpegArgs: string[] = [
    "-i",
    "pipe:0",
    ...(thumbPath ? ["-i", thumbPath] : []),
    "-map",
    "0:a",
    ...(thumbPath ? ["-map", "1:0"] : []),
    "-codec:a",
    "libmp3lame",
    "-q:a",
    "2",
    ...(thumbPath
      ? [
          "-id3v2_version",
          "3",
          "-metadata:s:v",
          "title=Album cover",
          "-metadata:s:v",
          "comment=Cover (front)",
        ]
      : []),
    ...(tags
      ? [
          "-metadata",
          `title=${tags.title}`,
          "-metadata",
          `artist=${tags.artist}`,
          "-metadata",
          `year=${tags.year}`,
          "-metadata",
          `genre=${tags.genre}`,
          "-metadata",
          `album=${tags.album}`,
        ]
      : []),
    "-y",
    mp3OutPath,
  ];

  await new Promise<void>((resolve, reject) => {
    const ytdlProc = spawn(ytDlpBin, [...YT_DLP_FLAGS, url]);
    const ffmpegProc = spawnFfmpeg(ffmpegPath, ffmpegArgs);

    ytdlProc.stdout.pipe(ffmpegProc.stdin);
    logProcessStderr(ytdlProc.stderr, "yt-dlp", log);
    logProcessStderr(ffmpegProc.stderr, "ffmpeg", log);
    ytdlProc.on("error", (err) => {
      log.error({ err }, "yt-dlp process error");
      reject(err);
    });
    ffmpegProc.on("error", (err) => {
      log.error({ err }, "ffmpeg process error");
      reject(err);
    });
    ffmpegProc.on("close", (code) => {
      if (code !== 0) {
        log.error({ exitCode: code, url }, "ffmpeg exited with non-zero code");
        reject(new Error(`ffmpeg exited with code ${code}`));
      } else {
        log.info(
          { url, durationMs: Date.now() - startTime, hasThumb: !!thumbPath, title: tags?.title },
          "MP3 conversion with tags complete"
        );
        resolve();
      }
    });
  });
}
