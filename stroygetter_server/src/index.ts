import fs from "fs";
import path from "path";

import dotenv from "dotenv";
import express from "express";
import cors = require("cors");
import ytdl = require("ytdl-core");
import ffmpeg from "fluent-ffmpeg";
import contentDisposition from "content-disposition";

import { VIDEO_FORMATS } from "./utils";

dotenv.config();

const app = express();
const PORT: string = process.env.SERVER_PORT || "3100";
const allowedOrigins = process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [];

if (!fs.existsSync(path.join(__dirname, "./temp_files"))) {
  fs.mkdirSync(path.join(__dirname, "./temp_files"));
  fs.chmodSync(path.join(__dirname, "./temp_files"), 0o777);
}
{
  const files = fs.readdirSync(path.join(__dirname, "./temp_files"));
  files.forEach((file) => {
    fs.unlinkSync(path.join(__dirname, `./temp_files/${file}`));
  });
}

const corsOptions: cors.CorsOptions = {
  origin: allowedOrigins || ["http://localhost:3000"],
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

  const videoData = await ytdl.getInfo(url);

  if (!videoData) {
    return res
      .status(400)
      .send({ message: "Please provide a correct youtube url !" });
  }

  let formats: {
    qualityLabel: string;
    itag: number;
  }[] = [];

  videoData.formats.forEach((format) => {
    if (format.qualityLabel === null) return;
    if (!format.hasVideo) return;

    const existingFormat = formats.find(
      (f) => f.qualityLabel === format.qualityLabel
    );

    if (existingFormat) {
      if (existingFormat.itag < format.itag) {
        existingFormat.itag = format.itag;
      }
      return;
    }

    formats.push({
      qualityLabel: format.qualityLabel,
      itag: format.itag,
    });
  });

  if (formats.length === 0) {
    return res.status(400).send({ message: "No size found !" });
  }

  const formattedVideoData = {
    title: videoData.videoDetails.title,
    author: videoData.videoDetails.author.name,
    thumbnail:
      videoData.videoDetails.thumbnails[
        videoData.videoDetails.thumbnails.length - 1
      ].url,
    url: videoData.videoDetails.video_url,
    formats: formats,
  };

  res.send(formattedVideoData);
});

app.get("/api/download", async (req, res) => {
  const url: string | undefined = req.query.url?.toString();
  var itag: string | undefined = req.query.itag?.toString();
  const quality: string | undefined = req.query.quality?.toString();

  if (!url || !itag || !quality) {
    res.status(400).send("Please provide a url, an itag and a quality !");
    return;
  }

  const videoData = await ytdl.getInfo(url);

  if (!videoData) {
    res.status(400).send("Please provide a correct youtube url !");
    return;
  }

  const metadata = {
    title: videoData.videoDetails.title,
    artist: videoData.videoDetails.author.name,
    author: videoData.videoDetails.author.name,
    year: videoData.videoDetails.publishDate.split("-")[0],
    genre: videoData.videoDetails.category,
    album: videoData.videoDetails.title,
  };

  videoData.videoDetails.title = videoData.videoDetails.title.replace(
    /[\s\/\\!@#$%^&*()_+={}[\]:;"'<>,.?~\\-]/g,
    "_"
  );

  videoData.videoDetails.title = videoData.videoDetails.title.replace(
    /[/\\?%*:|"<>]/g,
    ""
  );

  if (itag === "music") {
    const videoStream = ytdl(url, { quality: "highestaudio" });

    const audioStream = await ffmpeg()
      .input(videoStream)
      .audioCodec("libmp3lame")
      .format("mp3")
      .outputOptions("-metadata", `title=${metadata.title}`)
      .outputOptions("-metadata", `artist=${metadata.artist}`)
      .outputOptions("-metadata", `author=${metadata.author}`)
      .outputOptions("-metadata", `year=${metadata.year}`)
      .outputOptions("-metadata", `genre=${metadata.genre}`)
      .outputOptions("-metadata", `album=${metadata.album}`)
      .pipe();

    res.setHeader("Content-Type", "audio/mp3");
    res.setHeader(
      "Content-Disposition",
      contentDisposition(
        `attachment; filename="${videoData.videoDetails.title}.mp3"`
      )
    );

    audioStream.pipe(res);
    return;
  } else {
    const match = quality.match(/(\d+)p/);
    let size = "";
    if (match) {
      const resolution = match[1];
      const result = VIDEO_FORMATS.find(
        (item) => item.name === resolution + "p"
      );
      if (result) {
        size = result.format;
      } else {
        res.status(400).send("Please provide a correct quality !");
        return;
      }
    } else {
      res.status(400).send("Please provide a correct quality !");
      return;
    }

    const videoStream = ytdl(url, { quality: itag });
    const audioStream = ytdl(url, { quality: "highestaudio" });

    const writeVideoFile = fs.createWriteStream(
      path.join(__dirname, `./temp_files/${videoData.videoDetails.title}_video`)
    );
    const writeAudioFile = fs.createWriteStream(
      path.join(__dirname, `./temp_files/${videoData.videoDetails.title}_audio`)
    );
    const outputFilePath = path.join(
      __dirname,
      `./temp_files/${videoData.videoDetails.title}.mp4`
    );

    videoStream.pipe(writeVideoFile);
    audioStream.pipe(writeAudioFile);

    await Promise.all([
      waitForStreamClose(videoStream),
      waitForStreamClose(audioStream),
    ]);

    if (
      !fs.existsSync(
        path.join(
          __dirname,
          `./temp_files/${videoData.videoDetails.title}_video`
        )
      ) ||
      !fs.existsSync(
        path.join(
          __dirname,
          `./temp_files/${videoData.videoDetails.title}_audio`
        )
      ) ||
      !writeAudioFile.path ||
      !writeVideoFile.path ||
      typeof writeAudioFile.path !== "string" ||
      typeof writeVideoFile.path !== "string"
    ) {
      res.status(400).send("Error while downloading the files");
      return;
    }

    ffmpeg()
      .input(writeVideoFile.path)
      .input(writeAudioFile.path)
      .outputOptions(`-s ${size}`)
      .outputOptions("-c:v libx264")
      .outputOptions("-c:a aac")
      .outputOptions("-preset ultrafast")
      .outputOptions("-metadata", `title=${metadata.title}`)
      .outputOptions("-metadata", `artist=${metadata.artist}`)
      .outputOptions("-metadata", `author=${metadata.author}`)
      .outputOptions("-metadata", `year=${metadata.year}`)
      .outputOptions("-metadata", `genre=${metadata.genre}`)
      .outputOptions("-metadata", `album=${metadata.album}`)
      .save(outputFilePath)
      .on("end", async () => {
        //Send file to the client
        res.setHeader("Content-Type", "video/mp4");
        res.setHeader(
          "Content-Disposition",
          contentDisposition(
            `attachment; filename="${videoData.videoDetails.title}.mp4"`
          )
        );

        fs.createReadStream(outputFilePath).pipe(res);
        return;
      });

    return;
  }
});

app.use(function (req, res) {
  res.redirect(process.env.CLIENT_URL || "http://localhost:3000");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const waitForStreamClose = (stream: any) => {
  return new Promise<void>((resolve) => {
    stream.on("end", () => {
      resolve();
    });
  });
};
