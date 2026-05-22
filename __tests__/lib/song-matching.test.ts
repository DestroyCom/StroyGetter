import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseTitleArtist, resolveCanonicalIdentity, stripNoise } from "@/lib/song-matching";

vi.mock("@/lib/metadata/providers/itunes", () => ({
  searchItunesByQuery: vi.fn(),
}));
vi.mock("@/lib/metadata/providers/deezer", () => ({
  searchDeezerByQuery: vi.fn(),
}));

import { searchDeezerByQuery } from "@/lib/metadata/providers/deezer";
import { searchItunesByQuery } from "@/lib/metadata/providers/itunes";

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

  describe("real artist releases", () => {
    it("parses Olivia Rodrigo - deja vu (Official Video)", () => {
      expect(parseTitleArtist("Olivia Rodrigo - deja vu (Official Video)")).toEqual({
        artist: "Olivia Rodrigo",
        title: "deja vu",
      });
    });

    it("parses Olivia Rodrigo - the cure (Official Music Video)", () => {
      expect(parseTitleArtist("Olivia Rodrigo - the cure (Official Music Video)")).toEqual({
        artist: "Olivia Rodrigo",
        title: "the cure",
      });
    });

    it("parses LISA, Anitta, Rema, FIFA Sound - Goals", () => {
      expect(parseTitleArtist("LISA, Anitta, Rema, FIFA Sound - Goals")).toEqual({
        artist: "LISA, Anitta, Rema, FIFA Sound",
        title: "Goals",
      });
    });

    it("parses LE SSERAFIM (르세라핌) 'BOOMPALA' OFFICIAL MV", () => {
      expect(parseTitleArtist("LE SSERAFIM (르세라핌) 'BOOMPALA' OFFICIAL MV")).toEqual({
        artist: "LE SSERAFIM (르세라핌)",
        title: "BOOMPALA",
      });
    });

    it("parses FIFTY FIFTY (피프티피프티) 'STARSTRUCK' Special MV | 방과후 퇴마클럽", () => {
      expect(
        parseTitleArtist("FIFTY FIFTY (피프티피프티) 'STARSTRUCK' Special MV | 방과후 퇴마클럽")
      ).toEqual({
        artist: "FIFTY FIFTY (피프티피프티)",
        title: "STARSTRUCK",
      });
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

describe("resolveCanonicalIdentity", () => {
  const mockedItunes = vi.mocked(searchItunesByQuery);
  const mockedDeezer = vi.mocked(searchDeezerByQuery);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("query sent to APIs", () => {
    it.each([
      ["Artist - Title (Official Video)", "Artist - Title"],
      ["Artist - Title [Official MV]", "Artist - Title"],
      ["Artist - Title | Official Channel", "Artist - Title"],
      ['TWICE "ONE SPARK" M/V', 'TWICE "ONE SPARK"'],
      ["aespa 'Supernova' MV", "aespa 'Supernova'"],
      ["BTS (방탄소년단) 'Butter' Official MV", "BTS (방탄소년단) 'Butter'"],
      ["Artist - Title (Official Audio)", "Artist - Title"],
      ["Artist - Title - Official Music Video", "Artist - Title"],
      ["Artist - Title (Lyric Video)", "Artist - Title"],
      ["Artist - Title (Visualizer)", "Artist - Title"],
      ["(G)I-DLE - Nxde (Official Music Video)", "(G)I-DLE - Nxde"],
      ["NewJeans (뉴진스) 'Super Shy' MV", "NewJeans (뉴진스) 'Super Shy'"],
      ["Artist - Title (feat. Other) [Official Video]", "Artist - Title (feat. Other)"],
      ["Artist - Title (Official Video) [4K]", "Artist - Title"],
      ["Artist x Artist2 - Title (Official Music Video)", "Artist x Artist2 - Title"],
      ["Olivia Rodrigo - deja vu (Official Video)", "Olivia Rodrigo - deja vu"],
      ["Olivia Rodrigo - the cure (Official Music Video)", "Olivia Rodrigo - the cure"],
      ["LISA, Anitta, Rema, FIFA Sound - Goals", "LISA, Anitta, Rema, FIFA Sound - Goals"],
      ["LE SSERAFIM (르세라핌) 'BOOMPALA' OFFICIAL MV", "LE SSERAFIM (르세라핌) 'BOOMPALA'"],
      ["FIFTY FIFTY (피프티피프티) 'STARSTRUCK' Special MV | 방과후 퇴마클럽", "FIFTY FIFTY (피프티피프티) 'STARSTRUCK'"],
    ])("strips noise from '%s' → sends '%s'", async (ytTitle, expectedQuery) => {
      mockedItunes.mockResolvedValue({ artist: "A", title: "T" });
      mockedDeezer.mockResolvedValue(null);

      await resolveCanonicalIdentity(ytTitle);

      expect(mockedItunes).toHaveBeenCalledWith(expectedQuery);
      expect(mockedDeezer).toHaveBeenCalledWith(expectedQuery);
    });
  });

  describe("result selection", () => {
    it("returns iTunes result when available", async () => {
      const meta = { artist: "The Weeknd", title: "Blinding Lights", album: "After Hours" };
      mockedItunes.mockResolvedValue(meta);
      mockedDeezer.mockResolvedValue({ artist: "Other", title: "Other" });

      const result = await resolveCanonicalIdentity("The Weeknd - Blinding Lights (Official Video)");

      expect(result?.artist).toBe("The Weeknd");
      expect(result?.title).toBe("Blinding Lights");
      expect(result?.album).toBe("After Hours");
    });

    it("falls back to Deezer when iTunes returns null", async () => {
      mockedItunes.mockResolvedValue(null);
      mockedDeezer.mockResolvedValue({ artist: "Daft Punk", title: "Get Lucky" });

      const result = await resolveCanonicalIdentity("Daft Punk - Get Lucky (Official Audio)");

      expect(result?.artist).toBe("Daft Punk");
      expect(result?.title).toBe("Get Lucky");
    });

    it("runs iTunes and Deezer in parallel", async () => {
      const calls: string[] = [];
      mockedItunes.mockImplementation(async () => { calls.push("itunes"); return null; });
      mockedDeezer.mockImplementation(async () => { calls.push("deezer"); return null; });

      await resolveCanonicalIdentity("Artist - Title");

      expect(calls).toContain("itunes");
      expect(calls).toContain("deezer");
    });

    it("returns null when both APIs return null and title has no parseable artist", async () => {
      mockedItunes.mockResolvedValue(null);
      mockedDeezer.mockResolvedValue(null);

      const result = await resolveCanonicalIdentity("random vlog compilation 2024");

      expect(result).toBeNull();
    });

    it("falls back to parseTitleArtist when both APIs return null but title is parseable", async () => {
      mockedItunes.mockResolvedValue(null);
      mockedDeezer.mockResolvedValue(null);

      const result = await resolveCanonicalIdentity("Artist - Title (Official Video)");

      expect(result?.artist).toBe("Artist");
      expect(result?.title).toBe("Title");
    });

    it("falls back to parseTitleArtist when API result has no artist", async () => {
      mockedItunes.mockResolvedValue({ title: "Title" });
      mockedDeezer.mockResolvedValue(null);

      const result = await resolveCanonicalIdentity("Artist - Title");

      expect(result?.artist).toBe("Artist");
      expect(result?.title).toBe("Title");
    });

    it("falls back to parseTitleArtist when API result has no title", async () => {
      mockedItunes.mockResolvedValue({ artist: "Artist" });
      mockedDeezer.mockResolvedValue(null);

      const result = await resolveCanonicalIdentity("Artist - Title");

      expect(result?.artist).toBe("Artist");
      expect(result?.title).toBe("Title");
    });
  });

  describe("cross-validation fallback", () => {
    it("retries with structured query when API artist doesn't match parsed artist", async () => {
      // First round: full-text returns The Cure instead of Olivia Rodrigo
      mockedItunes.mockResolvedValueOnce({ artist: "The Cure", title: "Just Like Heaven" });
      mockedDeezer.mockResolvedValueOnce(null);
      // Second round: structured "Olivia Rodrigo the cure" returns the right track
      mockedItunes.mockResolvedValueOnce({ artist: "Olivia Rodrigo", title: "the cure", album: "GUTS" });
      mockedDeezer.mockResolvedValueOnce(null);

      const result = await resolveCanonicalIdentity("Olivia Rodrigo - the cure (Official Music Video)");

      expect(result?.artist).toBe("Olivia Rodrigo");
      expect(result?.title).toBe("the cure");
      expect(result?.album).toBe("GUTS");
    });

    it("sends 'artist title' as structured query on mismatch retry", async () => {
      mockedItunes.mockResolvedValueOnce({ artist: "The Cure", title: "Just Like Heaven" });
      mockedDeezer.mockResolvedValueOnce(null);
      mockedItunes.mockResolvedValueOnce({ artist: "Olivia Rodrigo", title: "the cure" });
      mockedDeezer.mockResolvedValueOnce(null);

      await resolveCanonicalIdentity("Olivia Rodrigo - the cure (Official Music Video)");

      expect(mockedItunes).toHaveBeenNthCalledWith(2, "Olivia Rodrigo the cure");
    });

    it("returns parsed identity when structured retry also fails", async () => {
      mockedItunes.mockResolvedValueOnce({ artist: "The Cure", title: "Just Like Heaven" });
      mockedDeezer.mockResolvedValueOnce(null);
      mockedItunes.mockResolvedValueOnce(null);
      mockedDeezer.mockResolvedValueOnce(null);

      const result = await resolveCanonicalIdentity("Olivia Rodrigo - the cure (Official Music Video)");

      expect(result?.artist).toBe("Olivia Rodrigo");
      expect(result?.title).toBe("the cure");
    });

    it("does NOT retry when API artist matches despite Korean in parens", async () => {
      // LE SSERAFIM (르세라핌) parsed vs "LE SSERAFIM" from API — should match
      mockedItunes.mockResolvedValue({ artist: "LE SSERAFIM", title: "BOOMPALA", album: "'PUREFLOW', Pt. 1" });
      mockedDeezer.mockResolvedValue(null);

      const result = await resolveCanonicalIdentity("LE SSERAFIM (르세라핌) 'BOOMPALA' OFFICIAL MV");

      expect(result?.artist).toBe("LE SSERAFIM");
      expect(mockedItunes).toHaveBeenCalledTimes(1);
    });

    it("does NOT retry for multi-artist with different separators (comma vs ampersand)", async () => {
      // "LISA, Anitta, Rema, FIFA Sound" vs "LISA, Anitta, Rema & FIFA Sound" — should match
      mockedItunes.mockResolvedValue({ artist: "LISA, Anitta, Rema & FIFA Sound", title: "Goals" });
      mockedDeezer.mockResolvedValue(null);

      const result = await resolveCanonicalIdentity("LISA, Anitta, Rema, FIFA Sound - Goals");

      expect(result?.artist).toBe("LISA, Anitta, Rema & FIFA Sound");
      expect(mockedItunes).toHaveBeenCalledTimes(1);
    });
  });
});
