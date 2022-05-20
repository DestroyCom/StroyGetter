import express from "express";
import ytdl = require("ytdl-core");
import cors = require("cors");
import ffmpegPath from "ffmpeg-static";
import stream from "stream";
import cp = require("child_process");

const app = express();
const PORT: number = 3100 || process.env.PORT;

const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.get("/api/get-infos", async (req, res) => {
  const url = req.query.url?.toString();

  if (!url) {
    return res
      .status(400)
      .send({ message: "Please provide a correct query !" });
  }

  if (!ytdl.validateURL(url)) {
    return res
      .status(400)
      .send({ message: "Please provide a correct youtube url !" });
  }

  ytdl.getInfo(url).then((info) => {
    res.send(info);
  });
});

app.get("/api/download-video", async (req, res) => {
  const url = req.query.url?.toString();
  const itag = req.query.itag?.toString();

  if (!url) {
    res.send("Please provide a url");
    return;
  }

  try {
    if (!ytdl.validateURL(url)) {
      return res.sendStatus(400);
    }

    ytmixer(url, itag).pipe(res);
  } catch (err) {
    console.error(err);
  }
});

app.get("/api/download-audio", async (req, res) => {
  const url = req.query.url?.toString();

  if (!url) {
    res.send("Please provide a url");
    return;
  }

  try {
    if (!ytdl.validateURL(url)) {
      return res.sendStatus(400);
    }

    ytdl(url, { filter: "audioonly" }).pipe(res);
  } catch (err) {
    console.error(err);
  }
});

app.listen(PORT);

const ytmixer = (link: any, itag: any, options = {}) => {
  const result = new stream.PassThrough({
    highWaterMark: (options as any).highWaterMark || 1024 * 512,
  });
  ytdl.getInfo(link, options).then((info) => {
    const audioStream = ytdl.downloadFromInfo(info, {
      ...options,
      quality: "highestaudio",
    });
    const videoStream = ytdl.downloadFromInfo(info, {
      ...options,
      quality: itag,
    });
    // create the ffmpeg process for muxing
    const ffmpegProcess = cp.spawn(
      ffmpegPath,
      [
        // supress non-crucial messages
        "-loglevel",
        "8",
        "-hide_banner",
        // input audio and video by pipe
        "-i",
        "pipe:3",
        "-i",
        "pipe:4",
        // map audio and video correspondingly
        "-map",
        "0:a",
        "-map",
        "1:v",
        // no need to change the codec
        "-c",
        "copy",
        // output mp4 and pipe
        "-f",
        "matroska",
        "pipe:5",
      ],
      {
        // no popup window for Windows users
        windowsHide: true,
        stdio: [
          // silence stdin/out, forward stderr,
          "inherit",
          "inherit",
          "inherit",
          // and pipe audio, video, output
          "pipe",
          "pipe",
          "pipe",
        ],
      }
    );
    //@ts-ignore
    audioStream.pipe(ffmpegProcess.stdio[3]);
    //@ts-ignore
    videoStream.pipe(ffmpegProcess.stdio[4]);
    //@ts-ignore
    ffmpegProcess.stdio[5].pipe(result);
  });
  return result;
};
