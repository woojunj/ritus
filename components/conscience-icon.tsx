import type { SVGProps } from "react";

/** 24×24 좌표에서 원(중심 12,12 반지름 10)에 꼭짓점이 닿는, 가로로 누운 육각형. */
export const CONSCIENCE_HEXAGON_PATH = "M22 12 17 20.66H7L2 12l5-8.66h10z";

// 양심노트의 아이콘. 여섯 덕목이 모두 자명일 때의 도표(원 안에 꽉 찬 육각형)에
// 가운데 점을 찍은 모양이다.
export function ConscienceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" strokeWidth="1" strokeOpacity="0.5" />
      <path
        d={CONSCIENCE_HEXAGON_PATH}
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <circle cx="12" cy="12" r="1.75" fill="currentColor" stroke="none" />
    </svg>
  );
}
