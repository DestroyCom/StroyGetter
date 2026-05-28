import { describe, expect, it } from "vitest";
import { vttToSylt } from "@/lib/lyrics/vtt-to-sylt";

const HEADER = "WEBVTT\n\n";

describe("vttToSylt", () => {
  it("parses a single cue with MM:SS.mmm timestamp", () => {
    const vtt = `${HEADER}00:01.500 --> 00:02.000\nHello world`;
    expect(vttToSylt(vtt)).toEqual([{ text: "Hello world", timeStamp: 1500 }]);
  });

  it("parses a single cue with HH:MM:SS.mmm timestamp", () => {
    const vtt = `${HEADER}00:02:30.000 --> 00:02:31.000\nChorus line`;
    expect(vttToSylt(vtt)).toEqual([{ text: "Chorus line", timeStamp: 150_000 }]);
  });

  it("strips HTML tags from cue text", () => {
    const vtt = `${HEADER}00:01.000 --> 00:02.000\n<c>Hello</c> <b>world</b>`;
    expect(vttToSylt(vtt)).toEqual([{ text: "Hello world", timeStamp: 1000 }]);
  });

  it("deduplicates consecutive identical cues (YouTube word-level VTT)", () => {
    const vtt = [
      HEADER.trimEnd(),
      "",
      "00:01.000 --> 00:02.000\nHello",
      "",
      "00:01.500 --> 00:02.500\nHello",
      "",
      "00:02.000 --> 00:03.000\nworld",
    ].join("\n");
    const result = vttToSylt(vtt);
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe("Hello");
    expect(result[1].text).toBe("world");
  });

  it("skips the WEBVTT header block", () => {
    const vtt = `WEBVTT\n\n00:01.000 --> 00:02.000\nOnly line`;
    expect(vttToSylt(vtt)).toHaveLength(1);
  });

  it("joins multiple text lines in a cue with a space", () => {
    const vtt = `${HEADER}00:01.000 --> 00:02.000\nLine one\nLine two`;
    expect(vttToSylt(vtt)).toEqual([{ text: "Line one Line two", timeStamp: 1000 }]);
  });

  it("skips cues with no text after tag stripping", () => {
    const vtt = `${HEADER}00:01.000 --> 00:02.000\n<b></b>`;
    expect(vttToSylt(vtt)).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    expect(vttToSylt("")).toEqual([]);
  });
});
