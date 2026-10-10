import { cn } from "@/lib/utils";

import {
  AXES,
  CHART_RADIUS,
  levelRadius,
  polarPoint,
  shapePoints,
} from "../lib/chart";
import { LEVELS, VIRTUES, type VirtueKey } from "../lib/form";

interface RadarChartProps {
  levels: Record<VirtueKey, number | null>;
  className?: string;
}

const LABEL_GAP = 20;

// 양식의 육각형 도표. 여섯 축과 세 겹의 동심원 위에 고른 단계를 점과 도형으로 그린다.
export function RadarChart({ levels, className }: RadarChartProps) {
  const points = shapePoints(levels);
  const summary = VIRTUES.filter((virtue) => levels[virtue.key] !== null)
    .map((virtue) => `${virtue.name} ${LEVELS[levels[virtue.key]!]}`)
    .join(", ");

  return (
    <svg
      role="img"
      aria-label={
        summary ? `여섯 덕목 도표: ${summary}` : "여섯 덕목 도표: 고른 단계 없음"
      }
      viewBox="-130 -118 260 236"
      className={cn("h-auto w-full max-w-64", className)}
    >
      {LEVELS.slice(1).map((_, index) => (
        <circle
          key={index}
          r={levelRadius(index + 1)}
          className="fill-none stroke-muted-foreground/40"
        />
      ))}
      {AXES.map((virtue) => {
        const end = polarPoint(virtue.angle, CHART_RADIUS);
        const label = polarPoint(virtue.angle, CHART_RADIUS + LABEL_GAP);
        return (
          <g key={virtue.key}>
            <line
              x1={0}
              y1={0}
              x2={end.x}
              y2={end.y}
              className="stroke-muted-foreground/40"
            />
            <text
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground text-[13px] font-semibold"
            >
              {virtue.name}
            </text>
          </g>
        );
      })}
      {/* 양식처럼 사랑 축 아래에 단계 이름을 적어 안쪽과 바깥쪽을 알린다. */}
      {LEVELS.map((level, index) => (
        <text
          key={level}
          x={-levelRadius(index)}
          y={13}
          textAnchor="middle"
          aria-hidden="true"
          className="fill-muted-foreground text-[9px]"
        >
          {level}
        </text>
      ))}
      {points.length > 1 && (
        <polygon
          points={points.map((point) => `${point.x},${point.y}`).join(" ")}
          strokeLinejoin="round"
          className="fill-primary/20 stroke-primary stroke-2"
        />
      )}
      {points.map((point) => (
        <circle
          key={point.key}
          data-virtue={point.key}
          cx={point.x}
          cy={point.y}
          r={4}
          className="fill-primary"
        />
      ))}
    </svg>
  );
}
