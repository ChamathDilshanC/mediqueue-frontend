import type { NextConfig } from "next";
const config: NextConfig = {
  // Self-contained server for the container image; Vercel ignores this setting.
  output: "standalone",
  turbopack: { root: process.cwd() },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};
export default config;
