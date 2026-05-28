import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getCookiesArgs, getCookiesOpt } from "@/lib/ytdlp-cookies";

describe("getCookiesArgs", () => {
  let tmpFile: string;
  const savedEnv = process.env.COOKIES_PATH;

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `cookies-test-${Date.now()}.txt`);
    delete process.env.COOKIES_PATH;
  });

  afterEach(() => {
    if (savedEnv === undefined) delete process.env.COOKIES_PATH;
    else process.env.COOKIES_PATH = savedEnv;
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  it("returns [] when COOKIES_PATH is not set", () => {
    expect(getCookiesArgs()).toEqual([]);
  });

  it("returns [] when COOKIES_PATH points to a missing file", () => {
    process.env.COOKIES_PATH = "/tmp/does-not-exist-sg-test.txt";
    expect(getCookiesArgs()).toEqual([]);
  });

  it("returns ['--cookies', path] when the file exists", () => {
    fs.writeFileSync(tmpFile, "# Netscape HTTP Cookie File\n");
    process.env.COOKIES_PATH = tmpFile;
    expect(getCookiesArgs()).toEqual(["--cookies", tmpFile]);
  });
});

describe("getCookiesOpt", () => {
  let tmpFile: string;
  const savedEnv = process.env.COOKIES_PATH;

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `cookies-opt-test-${Date.now()}.txt`);
    delete process.env.COOKIES_PATH;
  });

  afterEach(() => {
    if (savedEnv === undefined) delete process.env.COOKIES_PATH;
    else process.env.COOKIES_PATH = savedEnv;
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  it("returns {} when COOKIES_PATH is not set", () => {
    expect(getCookiesOpt()).toEqual({});
  });

  it("returns {} when COOKIES_PATH file is missing", () => {
    process.env.COOKIES_PATH = "/tmp/does-not-exist-sg-test.txt";
    expect(getCookiesOpt()).toEqual({});
  });

  it("returns { cookies: path } when the file exists", () => {
    fs.writeFileSync(tmpFile, "# Netscape HTTP Cookie File\n");
    process.env.COOKIES_PATH = tmpFile;
    expect(getCookiesOpt()).toEqual({ cookies: tmpFile });
  });
});
