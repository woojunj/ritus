import { ImageResponse } from "next/og";

import { CONSCIENCE_HEXAGON_PATH } from "@/components/conscience-icon";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

const GREEN = "#10b981";

// 브라우저 탭 아이콘. 양심노트 아이콘과 같은 모양을 앱의 초록색으로 그린다.
// SVG 파비콘을 그리지 않는 브라우저가 있어 PNG로 만든다.
export default function Icon() {
  return new ImageResponse(
    (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="64"
        height="64"
        viewBox="-1 -1 26 26"
        fill="none"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" stroke="#9ca3af" strokeWidth="1.25" />
        <path
          d={CONSCIENCE_HEXAGON_PATH}
          stroke={GREEN}
          strokeWidth="2.25"
          fill={GREEN}
          fillOpacity="0.2"
        />
        <circle cx="12" cy="12" r="2" fill={GREEN} />
      </svg>
    ),
    size
  );
}
