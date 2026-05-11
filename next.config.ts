import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["sharp", "ffmpeg-static", "prisma", "youtube-dl-exec"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
