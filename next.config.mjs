import fs from "fs";
import path from "path";

const packageJsonPath = path.resolve("./package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

const __dirname = path.resolve();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  publicRuntimeConfig: {
    version: packageJson.version,
  },
};

export default nextConfig;
