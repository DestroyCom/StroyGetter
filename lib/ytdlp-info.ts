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
  const ytdl = await selectYtDlpPath();

  const info = await ytdl(url, {
    dumpJson: true,
    noWarnings: true,
    noCheckCertificates: true,
    addHeader: ["referer:youtube.com", "user-agent:googlebot"],
  });

  const rawFormats = (info as { formats?: RawFormat[] }).formats ?? [];

  const seen = new Set<string>();
  return rawFormats
    .filter((f) => f.vcodec && f.vcodec !== "none" && f.acodec === "none" && f.height)
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
