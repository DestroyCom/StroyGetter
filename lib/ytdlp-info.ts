import { selectYtDlpPath } from "@/lib/serverUtils";
import type { FormatData } from "@/lib/types";

type RawFormat = {
  format_id: string;
  height?: number;
  format_note?: string;
  vcodec?: string;
  acodec?: string;
};

export async function getVideoFormats(url: string): Promise<FormatData[]> {
  const ytdl = selectYtDlpPath();

  const info = await ytdl(url, {
    dumpJson: true,
    noWarnings: true,
    noCheckCertificates: true,
    addHeader: ["referer:youtube.com", "user-agent:googlebot"],
  });

  const rawFormats = (info as { formats?: RawFormat[] }).formats ?? [];

  const seen = new Set<string>();
  return rawFormats
    .filter(
      (f) =>
        f.vcodec?.startsWith("avc") &&
        f.acodec === "none" &&
        f.height,
    )
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0))
    .reduce<FormatData[]>((acc, f) => {
      const itag = parseInt(f.format_id, 10);
      if (!Number.isFinite(itag)) return acc;
      const label = f.format_note || `${f.height}p`;
      if (!seen.has(label)) {
        seen.add(label);
        acc.push({ itag, qualityLabel: label });
      }
      return acc;
    }, []);
}
