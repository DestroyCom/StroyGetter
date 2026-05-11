"use client";

import { ArrowRight, Clipboard, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { searchQuery } from "@/functions/getYoutubeUrl";

export const GetterInput = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get("videoUrl");

  const [url, setUrl] = useState(videoUrl || "");
  const [pasteError, setPasteError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const submitUrl = async (value: string) => {
    const resolvedUrl = await searchQuery(value);
    router.push(`/fetch?videoUrl=${resolvedUrl}`);
  };

  const handlePaste = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const clipText = await navigator.clipboard.readText();
      setUrl(clipText);
      await submitUrl(clipText);
    } catch {
      setPasteError("Please paste manually or grant clipboard permission");
      inputRef.current?.focus();
      setTimeout(() => setPasteError(""), 4000);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const v = (e.currentTarget.elements.namedItem("video-url") as HTMLInputElement).value;
        return submitUrl(v);
      }}
      className="mx-auto w-full max-w-2xl"
    >
      {/* Search bar — label forwards clicks to the input natively */}
      <label
        htmlFor="video-url"
        className="mb-4 flex cursor-text items-center gap-3 rounded-2xl border border-white/16 bg-stroy-950 px-4 py-3.5 transition-colors focus-within:border-white/35"
      >
        <Search size={18} className="shrink-0 text-white/50" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Paste a YouTube URL or search query…"
          id="video-url"
          name="video-url"
          autoComplete="off"
          className="flex-1 bg-transparent font-mono text-sm text-white/55 outline-none placeholder:text-white/35 focus:text-white"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          type="button"
          title="Paste from clipboard"
          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/6 px-2.5 py-1.5 text-xs font-semibold text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
          onClick={handlePaste}
        >
          <Clipboard size={12} />
          Paste
        </button>
      </label>

      {pasteError && (
        <p className="mb-2 text-center text-xs text-red-400">{pasteError}</p>
      )}

      {/* CTA button */}
      <button
        type="submit"
        id="search-button"
        disabled={url.length === 0}
        className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-stroy-900 px-8 py-4 text-base font-bold text-white shadow-md transition-all duration-200 hover:bg-stroy-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Search video
        <ArrowRight size={18} />
      </button>
    </form>
  );
};
