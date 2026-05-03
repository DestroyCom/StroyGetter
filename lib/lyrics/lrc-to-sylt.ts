import type { SyltEntry } from "./types";

export function lrcToSylt(lrc: string): SyltEntry[] {
  return lrc
    .split("\n")
    .map((line) => {
      const match = line.match(/^\[(\d+):(\d+)\.(\d+)\]\s?(.*)$/);
      if (!match) return null;
      const [, min, sec, sub, text] = match;
      // sub can be 2 digits (hundredths) or 3 digits (milliseconds)
      const subMs = sub.length <= 2 ? parseInt(sub, 10) * 10 : parseInt(sub, 10);
      const timeStamp = parseInt(min, 10) * 60_000 + parseInt(sec, 10) * 1_000 + subMs;
      return { text: text.trim(), timeStamp };
    })
    .filter((e): e is SyltEntry => e !== null && e.text.length > 0);
}
