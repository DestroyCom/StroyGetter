import { describe, expect, it } from "vitest";
import { parseTitleArtist, stripNoise } from "@/lib/song-matching";

describe("stripNoise", () => {
  it("strips bare M/V at end", () => {
    expect(stripNoise('TWICE "ONE SPARK" M/V')).toBe('TWICE "ONE SPARK"');
  });

  it("strips bare MV at end (case-insensitive)", () => {
    expect(stripNoise("aespa 'Supernova' mv")).toBe("aespa 'Supernova'");
  });

  it("strips parenthesised Official Video", () => {
    expect(stripNoise("Artist - Title (Official Video)")).toBe("Artist - Title");
  });

  it("strips bracketed Official MV", () => {
    expect(stripNoise("Artist - Title [Official MV]")).toBe("Artist - Title");
  });

  it("strips Official Audio in parens", () => {
    expect(stripNoise("Artist - Title (Official Audio)")).toBe("Artist - Title");
  });

  it("strips Lyric Video in parens", () => {
    expect(stripNoise("Artist - Title (Lyric Video)")).toBe("Artist - Title");
  });

  it("strips bare dash-prefixed Official Music Video", () => {
    expect(stripNoise("Artist - Title - Official Music Video")).toBe("Artist - Title");
  });

  it("strips pipe and everything after", () => {
    expect(stripNoise("Artist - Title | Official Channel")).toBe("Artist - Title");
  });

  it("strips multiple stacked suffixes", () => {
    expect(stripNoise("Artist - Title (Official Video) | Topic")).toBe("Artist - Title");
  });

  it("preserves artist name with parentheses", () => {
    expect(stripNoise("(G)I-DLE - Nxde M/V")).toBe("(G)I-DLE - Nxde");
  });

  it("preserves Korean artist name with parens", () => {
    expect(stripNoise("NewJeans (뉴진스) 'Super Shy' MV")).toBe("NewJeans (뉴진스) 'Super Shy'");
  });

  it("returns unchanged when no noise", () => {
    expect(stripNoise("Artist - Title")).toBe("Artist - Title");
  });
});

describe("parseTitleArtist", () => {
  describe("pattern 1 — dash + quoted title", () => {
    it("handles straight double quotes", () => {
      expect(parseTitleArtist('BLACKPINK - "Pink Venom" M/V')).toEqual({
        artist: "BLACKPINK",
        title: "Pink Venom",
      });
    });

    it("handles straight single quotes", () => {
      expect(parseTitleArtist("BLACKPINK - 'Pink Venom' M/V")).toEqual({
        artist: "BLACKPINK",
        title: "Pink Venom",
      });
    });

    it("handles em-dash separator", () => {
      expect(parseTitleArtist("Artist — 'Title' (Official MV)")).toEqual({
        artist: "Artist",
        title: "Title",
      });
    });
  });

  describe("pattern 2 — space + quoted title (no dash)", () => {
    it('parses TWICE "ONE SPARK" M/V', () => {
      expect(parseTitleArtist('TWICE "ONE SPARK" M/V')).toEqual({
        artist: "TWICE",
        title: "ONE SPARK",
      });
    });

    it("parses with single quotes", () => {
      expect(parseTitleArtist("aespa 'Supernova' MV")).toEqual({
        artist: "aespa",
        title: "Supernova",
      });
    });

    it("preserves Korean artist translation in parens", () => {
      expect(parseTitleArtist("NewJeans (뉴진스) 'Super Shy' MV")).toEqual({
        artist: "NewJeans (뉴진스)",
        title: "Super Shy",
      });
    });

    it("parses artist with parens and dash in name", () => {
      expect(parseTitleArtist("(G)I-DLE ((여자)아이들) 'Nxde' Official Music Video")).toEqual({
        artist: "(G)I-DLE ((여자)아이들)",
        title: "Nxde",
      });
    });
  });

  describe("pattern 3 — corner brackets", () => {
    it("parses 「」", () => {
      expect(parseTitleArtist("BTS「Dynamite」Official MV")).toEqual({
        artist: "BTS",
        title: "Dynamite",
      });
    });

    it("parses 『』", () => {
      expect(parseTitleArtist("Artist『Song Title』MV")).toEqual({
        artist: "Artist",
        title: "Song Title",
      });
    });
  });

  describe("pattern 4 — standard dash", () => {
    it("parses simple Artist - Title", () => {
      expect(parseTitleArtist("Artist - Title")).toEqual({
        artist: "Artist",
        title: "Title",
      });
    });

    it("strips Official Video suffix", () => {
      expect(parseTitleArtist("Artist - Title (Official Video)")).toEqual({
        artist: "Artist",
        title: "Title",
      });
    });

    it("handles en-dash separator", () => {
      expect(parseTitleArtist("Artist – Title (Official Audio)")).toEqual({
        artist: "Artist",
        title: "Title",
      });
    });

    it("preserves parenthetical part of title", () => {
      expect(parseTitleArtist("Artist - Title (Deluxe Edition)")).toEqual({
        artist: "Artist",
        title: "Title (Deluxe Edition)",
      });
    });
  });

  describe("no match — returns null", () => {
    it("returns null for plain video title without artist pattern", () => {
      expect(parseTitleArtist("Just a random video title")).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(parseTitleArtist("")).toBeNull();
    });

    it("returns null when only noise remains after stripping", () => {
      expect(parseTitleArtist("Official Video")).toBeNull();
    });
  });
});
