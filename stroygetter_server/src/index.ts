import fs from "fs";
import path from "path";

import dotenv from "dotenv";
import express from "express";
import cors = require("cors");
import ytdl = require("ytdl-core");
import ffmpeg from "fluent-ffmpeg";
const Minio = require("minio");

import { getVideo, insertVideo } from "./db-initialize";

dotenv.config();

var minioOptions: {
  endPoint: string;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  port?: number;
} = {
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true" ? true : false,
  accessKey: process.env.MINIO_ROOT_USER || "user",
  secretKey: process.env.MINIO_ROOT_PASSWORD || "password",
};

const minioClient = new Minio.Client(minioOptions);

minioClient.bucketExists(
  process.env.MINIO_BUCKET_NAME || "videos",
  function (err: any, exists: any) {
    if (err) {
      console.log("------------------- ERROR -------------------");
      console.log("Error cheking bucket.");
      console.log(err);
      throw new Error("Error while checking if bucket exists");
    }
    if (!exists) {
      minioClient.makeBucket(
        process.env.MINIO_BUCKET_NAME || "videos",
        "us-east-1",
        function (err: any) {
          if (err) {
            console.log("------------------- ERROR -------------------");
            console.log("Error creating bucket.");
            console.log(err);
            throw new Error("Error while creating bucket");
          }
          console.log("Bucket created successfully in " + "us-east-1");
        }
      );
    } else {
      console.log("Bucket already exists.");
    }
  }
);

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
  videoData.videoDetails.title = videoData.videoDetails.title.replace(
    /[\s\/\\!@#$%^&*()_+={}[\]:;"'<>,.?~\\-]/g,
    "_"
  );

  if (!videoData) {
    res.status(400).send("Please provide a correct youtube url !");
    return;
  }

  if (itag === "music") {
    const videoStream = ytdl(url, { quality: "highestaudio" });

    const audioStream = await ffmpeg()
      .input(videoStream)
      .audioCodec("libmp3lame")
      .format("mp3")
      .pipe();

    const doesExist: any = await getVideo(
      videoData.videoDetails.videoId,
      "mp3"
    );

    if (doesExist) {
      const presignedUrl = await minioClient.presignedGetObject(
        process.env.MINIO_BUCKET_NAME || "videos",
        doesExist.minio_path,
        24 * 60 * 60
      );

      return res.send({
        url: presignedUrl,
      });
    }

    const minioPath = `${videoData.videoDetails.videoId}/${videoData.videoDetails.title}_${quality}.mp3`;

    await minioClient.putObject(
      process.env.MINIO_BUCKET_NAME || "videos",
      minioPath,
      audioStream,
      async function (err: any, etag: any) {
        console.log("etag", etag);
        if (err) {
          console.log("------------------- ERROR -------------------");
          console.log("Error uploading file.");
          console.log(err);
          throw new Error("Error while uploading file - music.");
        }

        await insertVideo(videoData.videoDetails.videoId, "mp3", minioPath);

        const presignedUrl = await minioClient.presignedGetObject(
          process.env.MINIO_BUCKET_NAME || "videos",
          minioPath,
          24 * 60 * 60
        );

        return res.send({
          url: presignedUrl,
        });
      }
    );
  } else {
    const match = quality.match(/(\d+)p/);
    let size = "";
    if (match) {
      const resolution = match[1];
      const result = format.find((item) => item.name === resolution + "p");
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

    const doesExist: any = await getVideo(
      videoData.videoDetails.videoId,
      quality
    );

    if (doesExist) {
      const presignedUrl = await minioClient.presignedGetObject(
        process.env.MINIO_BUCKET_NAME || "videos",
        doesExist.minio_path,
        24 * 60 * 60
      );

      return res.send({
        url: presignedUrl,
      });
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
      .save(outputFilePath)
      .on("end", async () => {
        const minioPath = `${videoData.videoDetails.videoId}/${videoData.videoDetails.title}_${quality}.mp4`;

        await minioClient.putObject(
          process.env.MINIO_BUCKET_NAME || "videos",
          minioPath,
          fs.createReadStream(outputFilePath),
          async function (err: any, etag: any) {
            console.log("etag", etag);
            if (err) {
              console.log("------------------- ERROR -------------------");
              console.log("Error uploading file video.");
              console.log(err);
              throw new Error("Error while uploading file");
            }

            await insertVideo(
              videoData.videoDetails.videoId,
              quality,
              minioPath
            );

            const presignedUrl = await minioClient.presignedGetObject(
              process.env.MINIO_BUCKET_NAME || "videos",
              minioPath,
              24 * 60 * 60
            );

            setTimeout(() => {
              fs.unlinkSync(writeVideoFile.path);
              fs.unlinkSync(writeAudioFile.path);
              fs.unlinkSync(outputFilePath);
            }, 10000);

            return res.send({
              url: presignedUrl,
            });
          }
        );
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

const format = [
  {
    name: "4320p",
    format: "7680x4320",
  },
  {
    name: "2160p",
    format: "3840x2160",
  },
  {
    name: "1440p",
    format: "2560x1440",
  },
  {
    name: "1080p",
    format: "1920x1080",
  },
  {
    name: "720p",
    format: "1280x720",
  },
  {
    name: "480p",
    format: "854x480",
  },
  {
    name: "360p",
    format: "640x360",
  },
  {
    name: "240p",
    format: "426x240",
  },
  {
    name: "144p",
    format: "256x144",
  },
];
