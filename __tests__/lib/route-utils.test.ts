import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildContentDisposition, cleanFiles } from "@/lib/route-utils";

describe("buildContentDisposition", () => {
  it("returns attachment header with encoded filename", () => {
    const result = buildContentDisposition("My Video", "mp4");
    expect(result).toBe(`attachment; filename="${encodeURIComponent("My Video")}.mp4"`);
  });

  it("strips combining diacritics (accents)", () => {
    const result = buildContentDisposition("Résumé naïf", "mp3");
    expect(result).toContain("Resume%20naif");
  });

  it("falls back to ext when title is empty", () => {
    const result = buildContentDisposition("", "mp4");
    expect(result).toBe(`attachment; filename="${encodeURIComponent("mp4")}.mp4"`);
  });

  it("percent-encodes special chars — no literal spaces", () => {
    const result = buildContentDisposition("A & B (feat. C)", "mp4");
    // Extract the filename portion and verify no unencoded spaces
    const match = result.match(/filename="([^"]+)"/);
    expect(match).toBeTruthy();
    if (match) {
      expect(match[1]).not.toContain(" "); // filename content should have no literal spaces
    }
    expect(result).toContain(".mp4");
  });
});

describe("cleanFiles", () => {
  let tmpDir: string;
  let file1: string;
  let file2: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sg-test-"));
    file1 = path.join(tmpDir, "a.txt");
    file2 = path.join(tmpDir, "b.txt");
    fs.writeFileSync(file1, "a");
    fs.writeFileSync(file2, "b");
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });
  });

  it("deletes existing files", () => {
    cleanFiles([file1, file2]);
    expect(fs.existsSync(file1)).toBe(false);
    expect(fs.existsSync(file2)).toBe(false);
  });

  it("does not throw for non-existent paths", () => {
    expect(() => cleanFiles([path.join(tmpDir, "ghost.txt")])).not.toThrow();
  });

  it("deletes only the files listed", () => {
    cleanFiles([file1]);
    expect(fs.existsSync(file1)).toBe(false);
    expect(fs.existsSync(file2)).toBe(true);
  });
});
