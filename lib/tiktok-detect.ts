export async function detectTiktokType(url: string): Promise<"video" | "photo"> {
  if (url.includes("/video/")) return "video";
  if (url.includes("/photo/")) return "photo";

  // Short URL (vm.tiktok.com, tiktok.com/t/) — follow HTTP redirect to detect type
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
    });
    if (res.url.includes("/photo/")) return "photo";
  } catch {
    // Network failure or timeout → assume video (safe default)
  }

  return "video";
}
