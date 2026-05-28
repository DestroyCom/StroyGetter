"use client";

import { ArrowRight, Clipboard, Loader2, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useDownloadState } from "@/components/custom/FetchPageShell";
import { resolveVideoUrl } from "@/functions/resolveVideoUrl";
import { useRouter } from "@/i18n/navigation";
import { track } from "@/lib/analytics";

const isKnownVideoUrl = (v: string): boolean =>
  v.includes("youtube.com") || v.includes("youtu.be") || v.includes("tiktok.com");

export const GetterInput = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get("videoUrl");
  const t = useTranslations("getterInput");

  const { isDownloading } = useDownloadState();

  const [url, setUrl] = useState(videoUrl || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [pasteError, setPasteError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset loading state when navigation completes (videoUrl changes in searchParams).
  // Without this, isLoading stays true after router.push() succeeds because the
  // component stays mounted across same-route navigations and the success path
  // never calls setIsLoading(false).
  useEffect(() => {
    setIsLoading(false);
    if (videoUrl) setUrl(videoUrl);
  }, [videoUrl]);

  const submitUrl = async (value: string, source: "typed" | "pasted" = "typed") => {
    setError("");
    setIsLoading(true);
    track("search", { query: value, is_url: isKnownVideoUrl(value), source });
    try {
      const resolvedUrl = await resolveVideoUrl(value);
      router.push(`/fetch?videoUrl=${resolvedUrl}`);
    } catch {
      track("search_error", { query: value });
      setError(t("errorNotFound"));
      setIsLoading(false);
    }
  };

  const handlePaste = async (e: React.MouseEvent) => {
    e.stopPropagation();
    let clipText: string;
    try {
      clipText = await navigator.clipboard.readText();
    } catch {
      setPasteError(t("errorClipboard"));
      inputRef.current?.focus();
      setTimeout(() => setPasteError(""), 4000);
      return;
    }
    setUrl(clipText);
    track("url_pasted");
    await submitUrl(clipText, "pasted");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const v = (e.currentTarget.elements.namedItem("video-url") as HTMLInputElement).value;
        return submitUrl(v, "typed");
      }}
      className="mx-auto w-full max-w-2xl"
    >
      <label
        htmlFor="video-url"
        className="mb-4 flex cursor-text items-center gap-3 rounded-2xl border border-white/16 bg-stroy-950 px-4 py-3.5 transition-colors focus-within:border-white/35"
      >
        <Search size={18} className="shrink-0 text-white/50" />
        <input
          ref={inputRef}
          type="text"
          placeholder={t("placeholder")}
          id="video-url"
          name="video-url"
          autoComplete="off"
          className="flex-1 bg-transparent font-mono text-sm text-white/55 outline-none placeholder:text-white/35 focus:text-white"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError("");
          }}
        />
        <button
          type="button"
          title={t("pasteTitle")}
          disabled={isLoading}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/6 px-2.5 py-1.5 text-xs font-semibold text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          onClick={handlePaste}
        >
          <Clipboard size={12} />
          {t("pasteButton")}
        </button>
      </label>

      {pasteError && <p className="mb-2 text-center text-xs text-red-400">{pasteError}</p>}
      {error && <p className="mb-2 text-center text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        id="search-button"
        disabled={url.length === 0 || isLoading || isDownloading}
        className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-stroy-900 px-8 py-4 text-base font-bold text-white shadow-md transition-all duration-200 hover:bg-stroy-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            {t("searching")}
          </>
        ) : (
          <>
            {t("searchButton")}
            <ArrowRight size={18} />
          </>
        )}
      </button>
    </form>
  );
};
