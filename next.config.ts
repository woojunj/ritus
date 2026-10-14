import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      // 화면이 그려지는 방식에는 관여하지 않는 보안 헤더만 둔다. 스크립트를 막는
      // CSP는 모든 화면을 동적 렌더링으로 바꿔야 해서 두지 않았다.
      {
        source: "/:path*",
        headers: [
          // 다른 사이트가 ritus를 틀 안에 넣지 못하게 한다.
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          // frame-ancestors를 이해하지 못하는 옛 브라우저를 위해 같은 뜻을 함께 둔다.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      // 서비스 워커 파일은 브라우저가 늘 새로 확인하게 한다.
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
