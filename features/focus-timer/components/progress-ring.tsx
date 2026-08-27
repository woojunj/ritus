"use client";

import { ringGeometry } from "../lib/ring";

interface ProgressRingProps {
  fraction: number;
  size?: number;
  strokeWidth?: number;
}

export function ProgressRing({
  fraction,
  size = 220,
  strokeWidth = 10,
}: ProgressRingProps) {
  const center = size / 2;
  const radius = size / 2 - strokeWidth;
  const { circumference, offset } = ringGeometry(radius, fraction);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className="shrink-0"
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        className="fill-none stroke-muted"
        strokeWidth={strokeWidth}
      />
      <circle
        data-testid="progress-ring-value"
        data-circumference={circumference}
        cx={center}
        cy={center}
        r={radius}
        className="fill-none stroke-primary transition-[stroke-dashoffset] duration-300 ease-linear"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
      />
    </svg>
  );
}
