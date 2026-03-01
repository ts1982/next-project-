import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname, "../../"),
  },
  typescript: {
    // TODO: 型不整合を修正後に削除する
    ignoreBuildErrors: true,
  },
  transpilePackages: ["@repo/database"],
};

export default nextConfig;
