import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname, "../../"),
  },
  transpilePackages: ["@repo/database"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // XSS攻撃を防止
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // clickjacking攻撃を防止
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // MIMEスニッフィング攻撃を防止
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // リファラーポリシー
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // 許可する機能を制限
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
