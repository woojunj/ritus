import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 서비스 워커 파일은 브라우저가 늘 새로 확인하게 한다.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
