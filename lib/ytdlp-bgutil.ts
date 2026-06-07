export function getBgutilArgs(): string[] {
  const url = process.env.BGUTIL_BASE_URL;
  if (!url) return [];
  return ["--extractor-args", `youtubepot-bgutilhttp:base_url=${url}`];
}

export function getBgutilOpt(): { extractorArgs?: string } {
  const url = process.env.BGUTIL_BASE_URL;
  if (!url) return {};
  return { extractorArgs: `youtubepot-bgutilhttp:base_url=${url}` };
}
