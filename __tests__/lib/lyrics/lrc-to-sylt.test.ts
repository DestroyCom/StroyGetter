import { describe, expect, it } from "vitest";
import { lrcToSylt } from "@/lib/lyrics/lrc-to-sylt";

describe("lrcToSylt", () => {
  it("parses a single line with 2-digit sub (hundredths)", () => {
    const result = lrcToSylt("[00:01.23] Hello world");
    expect(result).toEqual([{ text: "Hello world", timeStamp: 1_230 }]);
  });

  it("parses a single line with 3-digit sub (milliseconds)", () => {
    const result = lrcToSylt("[00:01.234] Hello world");
    expect(result).toEqual([{ text: "Hello world", timeStamp: 1_234 }]);
  });

  it("converts minutes correctly", () => {
    const result = lrcToSylt("[02:30.00] Chorus");
    expect(result).toEqual([{ text: "Chorus", timeStamp: 150_000 }]);
  });

  it("trims whitespace from text", () => {
    const result = lrcToSylt("[00:00.50]   Spaced   ");
    expect(result[0].text).toBe("Spaced");
  });

  it("skips lines without a valid LRC timestamp", () => {
    const lrc = "[ti:Song Title]\n[00:01.00] First line\nno timestamp here";
    const result = lrcToSylt(lrc);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("First line");
  });

  it("skips blank text lines (e.g. instrumental breaks)", () => {
    const lrc = "[00:01.00]\n[00:02.00] Real line";
    const result = lrcToSylt(lrc);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("Real line");
  });

  it("parses multiple lines in order", () => {
    const lrc = "[00:01.00] Line one\n[00:02.50] Line two\n[00:04.00] Line three";
    const result = lrcToSylt(lrc);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ text: "Line one", timeStamp: 1_000 });
    expect(result[1]).toEqual({ text: "Line two", timeStamp: 2_500 });
    expect(result[2]).toEqual({ text: "Line three", timeStamp: 4_000 });
  });

  it("returns empty array for empty input", () => {
    expect(lrcToSylt("")).toEqual([]);
  });
});
