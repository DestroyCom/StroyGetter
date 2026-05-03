import type { SyltEntry } from "./types";

function parseVttTimestamp(ts: string): number {
  const parts = ts.trim().split(":");
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return (parseInt(h, 10) * 3600 + parseInt(m, 10) * 60 + parseFloat(s)) * 1000;
  }
  const [m, s] = parts;
  return (parseInt(m, 10) * 60 + parseFloat(s)) * 1000;
}

export function vttToSylt(vtt: string): SyltEntry[] {
  const blocks = vtt.split(/\n\n+/);
  const entries: SyltEntry[] = [];

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    const timingIdx = lines.findIndex((l) => l.includes("-->"));
    if (timingIdx === -1) continue;

    const startRaw = lines[timingIdx].split("-->")[0].trim().split(/\s+/)[0];
    const timeStamp = Math.round(parseVttTimestamp(startRaw));

    const textLines = lines
      .slice(timingIdx + 1)
      .map((l) => l.replace(/<[^>]+>/g, "").trim())
      .filter((l) => l.length > 0);

    if (textLines.length === 0) continue;

    const text = textLines.join(" ");
    // Deduplicate consecutive identical lines (YouTube word-level VTT repeats blocks)
    if (entries.length === 0 || entries[entries.length - 1].text !== text) {
      entries.push({ text, timeStamp });
    }
  }

  return entries;
}
