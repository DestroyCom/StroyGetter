"use client";

import { useEffect, useState } from "react";
import { getVideoInfos } from "@/functions/fetchVideoinfos";
import { useRouter, useSearchParams } from "next/navigation";
import { YouTubeVideo } from "play-dl";
import { Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import clsx from "clsx";
import { formatData } from "@/lib/types";
import { VideoLoading } from "./VideoLoading";
import { Progress } from "../ui/progress";

export const VideoSelect = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get("videoUrl");

  const [videoData, setVideoData] = useState<YouTubeVideo | null>(null);
  const [formats, setFormats] = useState<Partial<formatData>[] | null>(null);

  const [selectedQuality, setSelectedQuality] = useState<string>("audio");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [loadProgress, setLoadProgress] = useState<number>(0);

  useEffect(() => {
    if (!videoUrl) {
      router.push("/");
    }
  }, [videoUrl, router]);

  useEffect(() => {
    setError(null);

    const asynchroneousFetch = async () => {
      if (!videoUrl) {
        return;
      }

      setIsLoading(true);

      const value = await getVideoInfos(videoUrl);

      if (value.error) {
        setError(value.error);
        setIsLoading(false);
        return;
      }

      setVideoData(value.video_details);
      setFormats(value.format);
      setSelectedQuality(value.format[0].itag.toString());

      setIsLoading(false);
    };

    asynchroneousFetch();
  }, [videoUrl]);

  useEffect(() => {
    if (isDownloading) {
      const maxProgress = 90;
      const incrementDuration = 10000;
      const incrementInterval = 25;

      const startTime = Date.now();

      const updateProgress = () => {
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTime;

        const newProgress =
          maxProgress * (1 - Math.exp(-elapsedTime / incrementDuration));

        setLoadProgress(newProgress);

        if (newProgress >= maxProgress) {
          clearInterval(interval);
        }
      };

      updateProgress();

      const interval = setInterval(updateProgress, incrementInterval);

      return () => clearInterval(interval);
    }

    return undefined;
  }, [isDownloading]);

  if (isLoading) {
    return <VideoLoading />;
  }

  if (error || !videoData) {
    return (
      <section className="py-8" id="error-search">
        <div className="mx-auto my-2 flex h-auto min-h-40 w-11/12 rounded-lg border-2 border-dashed border-[#102F42]">
          <p className="m-auto mx-auto text-center font-bold text-red-700 md:text-xl">
            {error ? error : "An error occured"}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="mx-auto my-2 flex min-h-40 h-auto w-11/12 rounded-lg border-2 border-dashed border-primary py-2 md:py-4 lg:text-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          // @ts-expect-error -- play-dl is wrongly typed
          src={videoData.thumbnail.url}
          title={`Thumbnail of ${videoData.title}`}
          className="m-auto aspect-video w-3/12 rounded-lg"
          alt={`Thumbnail of ${videoData.title}`}
        />
        <div className="my-auto flex w-8/12 flex-col">
          <h3 className="line-clamp-2">
            {videoData.title}{" "}
            <span className="font-light italic">
              by {videoData.channel?.name}
            </span>
          </h3>
          <div className="mx-2 flex flex-col justify-end md:my-2 md:flex-row">
            <Select
              defaultValue={(formats && formats[0].qualityLabel) || "audio"}
              onValueChange={(value) => {
                setSelectedQuality(value);
              }}
              value={selectedQuality}
              disabled={isDownloading}
            >
              <SelectTrigger
                className="my-0.5 w-full border-primary bg-secondary text-white outline-primary md:mx-2 md:h-auto"
                id="quality-select"
              >
                <SelectValue placeholder="Quality" />
              </SelectTrigger>
              <SelectContent>
                {formats &&
                  formats.map((format) => {
                    if (!format.qualityLabel) return null;
                    if (!format.itag) return null;

                    return (
                      <SelectItem
                        key={format.qualityLabel}
                        value={format.itag.toString()}
                        id={`quality-select-${format.qualityLabel}`}
                      >
                        <p
                          className="flex justify-between"
                          id={`quality-select-${format.qualityLabel}`}
                        >
                          <span className="my-auto">{format.qualityLabel}</span>{" "}
                        </p>
                      </SelectItem>
                    );
                  })}
                <SelectItem value="audio" id="quality-select-music">
                  <p className="flex justify-between" id="quality-select-music">
                    <span className="my-auto">Audio (mp3)</span>{" "}
                  </p>
                </SelectItem>
              </SelectContent>
            </Select>

            <button
              type="button"
              id="download-button"
              disabled={isDownloading}
              onClick={async (e) => {
                e.preventDefault();
                setIsDownloading(true);

                try {
                  const video = await fetch(
                    `/api/video-converter?url=${videoUrl}&quality=${selectedQuality}`,
                    {
                      method: "GET",
                    }
                  );

                  const extension = selectedQuality === "audio" ? "mp3" : "mp4";

                  const blob = await video.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${videoData.title}.${extension}`;
                  a.click();
                } catch (e) {
                  console.error(e);
                }
                setIsDownloading(false);
              }}
              className={clsx(
                "flex w-full flex-row justify-center rounded-lg border-2 border-transparent bg-[#102F42] px-4 py-2 text-center font-bold text-white transition-all ease-in-out",
                "md:mx-2",
                !isDownloading &&
                  "hover:cursor-pointer hover:border-primary hover:bg-secondary",
                isDownloading && "hidden opacity-50 md:flex"
              )}
            >
              Download <Download className="ml-2" size={24} />
            </button>
          </div>

          <div
            className={clsx(
              "mx-2 my-auto flex h-auto flex-col justify-end",
              "md:my-2 md:h-10 md:flex-row",
              isDownloading && "!h-10"
            )}
          >
            {isDownloading && (
              <Progress value={loadProgress} className="my-auto" />
            )}
          </div>
        </div>
      </div>

      <p className="text-center text-sm font-extralight italic opacity-80 md:text-base md:font-light">
        Conversion may take some time. <br />
        Please be patient and do not reload the page.
      </p>
    </section>
  );
};