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

describe("real-world title format coverage", () => {
  describe("M/V and MV suffix — K-pop variants", () => {
    it('parses ITZY "WANNABE" M/V', () => {
      expect(parseTitleArtist('ITZY "WANNABE" M/V')).toEqual({ artist: "ITZY", title: "WANNABE" });
    });

    it("parses STAYC(스테이씨) 'ASAP' MV", () => {
      expect(parseTitleArtist("STAYC(스테이씨) 'ASAP' MV")).toEqual({ artist: "STAYC(스테이씨)", title: "ASAP" });
    });

    it("parses (G)I-DLE (여자)아이들 'Nxde' Official MV", () => {
      expect(parseTitleArtist("(G)I-DLE (여자)아이들 'Nxde' Official MV")).toEqual({ artist: "(G)I-DLE (여자)아이들", title: "Nxde" });
    });

    it("parses IVE 아이브 'LOVE DIVE' MV", () => {
      expect(parseTitleArtist("IVE 아이브 'LOVE DIVE' MV")).toEqual({ artist: "IVE 아이브", title: "LOVE DIVE" });
    });

    it("parses Le Sserafim (르세라핌) 'ANTIFRAGILE' MV", () => {
      expect(parseTitleArtist("Le Sserafim (르세라핌) 'ANTIFRAGILE' MV")).toEqual({ artist: "Le Sserafim (르세라핌)", title: "ANTIFRAGILE" });
    });

    it("parses Kep1er (케플러) 'WA DA DA' MV", () => {
      expect(parseTitleArtist("Kep1er (케플러) 'WA DA DA' MV")).toEqual({ artist: "Kep1er (케플러)", title: "WA DA DA" });
    });
  });

  describe("Official Video and Music Video suffix variants", () => {
    it("strips (Official Music Video)", () => {
      expect(parseTitleArtist("Artist - Title (Official Music Video)")).toEqual({ artist: "Artist", title: "Title" });
    });

    it('strips (Official Music Video) with quoted title', () => {
      expect(parseTitleArtist('Artist - "Title" (Official Music Video)')).toEqual({ artist: "Artist", title: "Title" });
    });

    it("strips [Official Music Video]", () => {
      expect(parseTitleArtist("Artist - Title [Official Music Video]")).toEqual({ artist: "Artist", title: "Title" });
    });

    it("strips | Official Music Video via pipe", () => {
      expect(parseTitleArtist("Artist - Title | Official Music Video")).toEqual({ artist: "Artist", title: "Title" });
    });

    it("handles em-dash separator with Official Video", () => {
      expect(parseTitleArtist("Artist — Title (Official Video)")).toEqual({ artist: "Artist", title: "Title" });
    });

    it("handles collab Artist x Artist2", () => {
      expect(parseTitleArtist("Artist x Artist2 - Title (Official Music Video)")).toEqual({ artist: "Artist x Artist2", title: "Title" });
    });

    it("handles Artist & Artist2", () => {
      expect(parseTitleArtist("Artist & Artist2 - Title (Official Music Video)")).toEqual({ artist: "Artist & Artist2", title: "Title" });
    });
  });

  describe("BTS and Korean/Japanese bracket formats", () => {
    it("parses BTS (방탄소년단) 'Butter' Official MV", () => {
      expect(parseTitleArtist("BTS (방탄소년단) 'Butter' Official MV")).toEqual({ artist: "BTS (방탄소년단)", title: "Butter" });
    });

    it("parses BTS - 'Fake Love' Official MV", () => {
      expect(parseTitleArtist("BTS - 'Fake Love' Official MV")).toEqual({ artist: "BTS", title: "Fake Love" });
    });
  });

  describe("Lyric and Lyrics Video suffix variants", () => {
    it("strips (Official Lyric Video)", () => {
      expect(parseTitleArtist("Artist - Title (Official Lyric Video)")).toEqual({ artist: "Artist", title: "Title" });
    });

    it("strips (Lyrics)", () => {
      expect(parseTitleArtist("Artist - Title (Lyrics)")).toEqual({ artist: "Artist", title: "Title" });
    });

    it("strips [Lyrics Video]", () => {
      expect(parseTitleArtist("Artist - Title [Lyrics Video]")).toEqual({ artist: "Artist", title: "Title" });
    });

    it("strips (Lyric Video)", () => {
      expect(parseTitleArtist("Artist - Title (Lyric Video)")).toEqual({ artist: "Artist", title: "Title" });
    });

    it('strips (Official Lyrics Video) with quoted title', () => {
      expect(parseTitleArtist('Artist - "Title" (Official Lyrics Video)')).toEqual({ artist: "Artist", title: "Title" });
    });

    it("strips | Lyrics via pipe", () => {
      expect(parseTitleArtist("Artist - Title | Lyrics")).toEqual({ artist: "Artist", title: "Title" });
    });

    it("strips (with lyrics)", () => {
      expect(parseTitleArtist("Artist - Title (with lyrics)")).toEqual({ artist: "Artist", title: "Title" });
    });

    it("strips (Lyrics / Lyric Video)", () => {
      expect(parseTitleArtist("Artist - Title (Lyrics / Lyric Video)")).toEqual({ artist: "Artist", title: "Title" });
    });
  });

  describe("Visualizer suffix variants", () => {
    it("strips (Official Visualizer)", () => {
      expect(parseTitleArtist("Artist - Title (Official Visualizer)")).toEqual({ artist: "Artist", title: "Title" });
    });

    it("strips [Visualizer]", () => {
      expect(parseTitleArtist("Artist - Title [Visualizer]")).toEqual({ artist: "Artist", title: "Title" });
    });

    it("strips (Audio Visualizer)", () => {
      expect(parseTitleArtist("Artist - Title (Audio Visualizer)")).toEqual({ artist: "Artist", title: "Title" });
    });

    it("strips | Visualizer via pipe", () => {
      expect(parseTitleArtist("Artist - Title | Visualizer")).toEqual({ artist: "Artist", title: "Title" });
    });

    it('strips (Visualizer) with quoted title', () => {
      expect(parseTitleArtist('Artist - "Title" (Visualizer)')).toEqual({ artist: "Artist", title: "Title" });
    });

    it("strips (Visualizer Video)", () => {
      expect(parseTitleArtist("Artist - Title (Visualizer Video)")).toEqual({ artist: "Artist", title: "Title" });
    });
  });

  describe("Audio suffix variants", () => {
    it("strips (Official Audio)", () => {
      expect(parseTitleArtist("Artist - Title (Official Audio)")).toEqual({ artist: "Artist", title: "Title" });
    });

    it("strips [Official Audio]", () => {
      expect(parseTitleArtist("Artist - Title [Official Audio]")).toEqual({ artist: "Artist", title: "Title" });
    });

    it("strips (Audio)", () => {
      expect(parseTitleArtist("Artist - Title (Audio)")).toEqual({ artist: "Artist", title: "Title" });
    });

    it("strips | Official Audio via pipe", () => {
      expect(parseTitleArtist("Artist - Title | Official Audio")).toEqual({ artist: "Artist", title: "Title" });
    });

    it("strips (Full Audio)", () => {
      expect(parseTitleArtist("Artist - Title (Full Audio)")).toEqual({ artist: "Artist", title: "Title" });
    });
  });

  describe("Live and Performance suffix variants", () => {
    it("strips (Live Performance)", () => {
      expect(parseTitleArtist("Artist - Title (Live Performance)")).toEqual({ artist: "Artist", title: "Title" });
    });

    it("strips | Live on Show via pipe", () => {
      expect(parseTitleArtist("Artist - Title | Live on Show Name")).toEqual({ artist: "Artist", title: "Title" });
    });

    it("strips (Acoustic Version)", () => {
      expect(parseTitleArtist("Artist - Title (Acoustic Version)")).toEqual({ artist: "Artist", title: "Title" });
    });

    it("strips (Live Session)", () => {
      expect(parseTitleArtist("Artist - Title (Live Session)")).toEqual({ artist: "Artist", title: "Title" });
    });

    it('strips (Official Live Video) with quoted title', () => {
      expect(parseTitleArtist('Artist - "Title" (Official Live Video)')).toEqual({ artist: "Artist", title: "Title" });
    });
  });

  describe("featuring artist formats", () => {
    it("preserves (feat. Artist2) in title, strips [Official Video]", () => {
      expect(parseTitleArtist("Artist - Title (feat. Artist2) [Official Video]")).toEqual({ artist: "Artist", title: "Title (feat. Artist2)" });
    });

    it("handles ft. Artist2 in artist name", () => {
      expect(parseTitleArtist("Artist ft. Artist2 - Title (Official Music Video)")).toEqual({ artist: "Artist ft. Artist2", title: "Title" });
    });

    it("preserves (featuring Artist2) in title", () => {
      expect(parseTitleArtist("Artist - Title (featuring Artist2) Official Video")).toEqual({ artist: "Artist", title: "Title (featuring Artist2)" });
    });
  });

  describe("quality and version suffixes", () => {
    it("strips (Official Video) [4K]", () => {
      expect(parseTitleArtist("Artist - Title (Official Video) [4K]")).toEqual({ artist: "Artist", title: "Title" });
    });

    it("strips (MV) [4K UHD]", () => {
      expect(parseTitleArtist("Artist - Title (MV) [4K UHD]")).toEqual({ artist: "Artist", title: "Title" });
    });

    it("strips (Official MV) [Remastered]", () => {
      expect(parseTitleArtist("Artist - Title (Official MV) [Remastered]")).toEqual({ artist: "Artist", title: "Title" });
    });

    it("preserves (Director's Cut) as part of title", () => {
      expect(parseTitleArtist("Artist - Title (Director's Cut)")).toEqual({ artist: "Artist", title: "Title (Director's Cut)" });
    });

    it("strips (Extended Version) [Official Video]", () => {
      expect(parseTitleArtist("Artist - Title (Extended Version) [Official Video]")).toEqual({ artist: "Artist", title: "Title" });
    });

    it("preserves (Remix) and ft. Artist2 in title", () => {
      expect(parseTitleArtist("Artist - Title (Remix) ft. Artist2 [Official Video]")).toEqual({ artist: "Artist", title: "Title (Remix) ft. Artist2" });
    });

    it("strips (Acoustic Version) [Official Video]", () => {
      expect(parseTitleArtist("Artist - Title (Acoustic Version) [Official Video]")).toEqual({ artist: "Artist", title: "Title" });
    });

    it("strips (Piano Version)", () => {
      expect(parseTitleArtist("Artist - Title (Piano Version)")).toEqual({ artist: "Artist", title: "Title" });
    });

    it("preserves (Slowed + Reverb) in title", () => {
      expect(parseTitleArtist("Artist - Title (Slowed + Reverb)")).toEqual({ artist: "Artist", title: "Title (Slowed + Reverb)" });
    });

    it("preserves (Nightcore) in title", () => {
      expect(parseTitleArtist("Artist - Title (Nightcore)")).toEqual({ artist: "Artist", title: "Title (Nightcore)" });
    });
  });

  describe("choreography and dance formats", () => {
    it("preserves (Dance Practice) in title", () => {
      expect(parseTitleArtist("Artist - Title (Dance Practice)")).toEqual({ artist: "Artist", title: "Title (Dance Practice)" });
    });

    it("strips | Dance Performance Video via pipe", () => {
      expect(parseTitleArtist("Artist - Title | Dance Performance Video")).toEqual({ artist: "Artist", title: "Title" });
    });

    it("strips (Performance Video)", () => {
      expect(parseTitleArtist("Artist - Title (Performance Video)")).toEqual({ artist: "Artist", title: "Title" });
    });
  });

  describe("title with year suffix", () => {
    it("strips (Official Video 2024)", () => {
      expect(parseTitleArtist("Artist - Title (Official Video 2024)")).toEqual({ artist: "Artist", title: "Title" });
    });

    it("strips [2024 MV]", () => {
      expect(parseTitleArtist("Artist - Title [2024 MV]")).toEqual({ artist: "Artist", title: "Title" });
    });

    it("preserves (New Single 2024) in title", () => {
      expect(parseTitleArtist("Artist - Title (New Single 2024)")).toEqual({ artist: "Artist", title: "Title (New Single 2024)" });
    });
  });
});
