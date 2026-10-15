import type { SVGProps } from "react";

/** 24×24 좌표에서 원(중심 12,12 반지름 10)에 꼭짓점이 닿는, 가로로 누운 육각형. */
export const CONSCIENCE_HEXAGON_PATH = "M22 12 17 20.66H7L2 12l5-8.66h10z";

/** 위 육각형의 꼭짓점. 도표에서 자명을 고른 점처럼 원 위에 놓인다. */
export const CONSCIENCE_HEXAGON_VERTICES: [number, number][] = [
  [22, 12],
  [17, 20.66],
  [7, 20.66],
  [2, 12],
  [7, 3.34],
  [17, 3.34],
];

// 양심노트의 아이콘. 여섯 덕목이 모두 자명일 때의 도표(원 위의 여섯 점을 이은
// 육각형)에 가운데 점을 찍은 모양이다.
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
      <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
      <path
        d={CONSCIENCE_HEXAGON_PATH}
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.35"
      />
      {/* 선 모서리 대신 점이 원 위에 놓이게 해, 원 밖으로 나온 부분이 의도한 모양으로 읽힌다. */}
      {CONSCIENCE_HEXAGON_VERTICES.map(([x, y]) => (
        <circle key={`${x},${y}`} cx={x} cy={y} r="1.5" fill="currentColor" stroke="none" />
      ))}
      <circle cx="12" cy="12" r="1.75" fill="currentColor" stroke="none" />
    </svg>
  );
}
