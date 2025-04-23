"use client";

import { searchQuery } from "@/functions/getYoutubeUrl";
import clsx from "clsx";
import { ClipboardCopy } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export const GetterInput = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const videoUrl = searchParams.get("videoUrl");

  const [url, setUrl] = useState(videoUrl || "");
  const [permission, setPermission] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const queryOpts = { name: "clipboard-read", allowWithoutGesture: false };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const permissionStatus = await navigator.permissions.query(queryOpts);

    if (permissionStatus.state === "granted") {
      setPermission(true);
    } else {
      setPermission(false);
    }

    // Listen for changes to the permission state
    permissionStatus.onchange = () => {
      if (permissionStatus.state === "granted") {
        setPermission(true);
      } else {
        setPermission(false);
      }
    };
  };

  const submitUrl = async (url: string) => {
    const getUrl = await searchQuery(url);

    router.push(`/fetch?videoUrl=${getUrl}`);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const videoUrl = e.currentTarget["video-url"].value;
        return submitUrl(videoUrl);
      }}
      className="mx-4 flex flex-col justify-center md:mx-auto md:w-4/6"
    >
      <div className="relative my-4 w-full">
        <input
          type="text"
          placeholder="Please enter a youtube video URL or a search query"
          id="video-url"
          name="video-url"
          className="block w-full rounded-md border border-[#081721] bg-[#081721] p-2.5 text-white focus:border-blue-500 focus:ring-blue-500"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          type="button"
          id="clipboard-copy"
          className={clsx(
            "absolute inset-y-0 right-0 flex items-center overflow-hidden rounded-r-md bg-secondary px-4 transition-all",
            permission ? "opacity-100" : "bg-secondary/25",
            "hover:pointer-events-auto hover:cursor-pointer hover:bg-secondary/60 hover:opacity-100"
          )}
          title="Copy from clipboard"
          onClick={() => {
            navigator.clipboard.readText().then((clipText) => {
              setUrl(clipText);
              setTimeout(() => {
                submitUrl(clipText);
              }, 200);
            });
          }}
        >
          <ClipboardCopy size={24} />
        </button>
      </div>
      <button
        type="submit"
        id="search-button"
        className="border-1 m-auto mx-auto rounded-md border border-solid border-transparent bg-[#205D83] px-5 py-2.5 text-center text-lg font-medium text-white transition-all duration-200 ease-in-out hover:cursor-pointer hover:border-[#205D83] hover:bg-[#102F42] hover:ring-[#205D83] focus:outline-none focus:ring-2 focus:ring-blue-300 sm:w-auto disabled:opacity-50"
        disabled={url.length === 0}
      >
        {false ? "Loading..." : "Search"}
      </button>
    </form>
  );
};
