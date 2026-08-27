"use client";

import { useCallback, useRef } from "react";

import { ringGeometry } from "../lib/ring";

interface DialProps {
  value: number;
  min: number;
  max: number;
  valueToAngle: (value: number) => number;
  angleToValue: (angle: number) => number;
  onChange: (value: number) => void;
  ariaLabel: string;
  ariaValueText: (value: number) => string;
  disabled?: boolean;
  size?: number;
}

const DEFAULT_SIZE = 220;

function pointOnCircle(angleDeg: number, center: number, radius: number) {
  // 0도가 12시 방향이 되도록 90도를 뺀다.
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: center + radius * Math.cos(rad),
    y: center + radius * Math.sin(rad),
  };
}

function angleFromPointerEvent(
  event: { clientX: number; clientY: number },
  rect: DOMRect
): number {
  const x = event.clientX - (rect.left + rect.width / 2);
  const y = event.clientY - (rect.top + rect.height / 2);
  const rad = Math.atan2(y, x);
  const deg = (rad * 180) / Math.PI + 90;
  return deg;
}

// 큰 다이얼(분)과 작은 다이얼(초)이 공유하는 끌기·키보드·SVG 렌더링. 두
// 다이얼은 눈금의 의미(분/초)와 값의 범위만 다르다.
export function Dial({
  value,
  min,
  max,
  valueToAngle,
  angleToValue,
  onChange,
  ariaLabel,
  ariaValueText,
  disabled,
  size = DEFAULT_SIZE,
}: DialProps) {
  const center = size / 2;
  const radius = size / 2 - 12;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const draggingRef = useRef(false);

  const applyPointer = useCallback(
    (event: { clientX: number; clientY: number }) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const angle = angleFromPointerEvent(event, rect);
      onChange(angleToValue(angle));
    },
    [angleToValue, onChange]
  );

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (disabled) return;
    draggingRef.current = true;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // 합성 이벤트 등 캡처가 불가능한 환경에서도 드래그 값 반영은 계속한다.
    }
    applyPointer(event);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (disabled || !draggingRef.current) return;
    applyPointer(event);
  };

  const handlePointerUp = (event: React.PointerEvent<SVGSVGElement>) => {
    draggingRef.current = false;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // 캡처하지 못했던 경우 해제도 조용히 무시한다.
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<SVGSVGElement>) => {
    if (disabled) return;
    if (event.key === "ArrowUp" || event.key === "ArrowRight") {
      event.preventDefault();
      onChange(Math.min(max, value + 1));
    } else if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
      event.preventDefault();
      onChange(Math.max(min, value - 1));
    } else if (event.key === "Home") {
      event.preventDefault();
      onChange(min);
    } else if (event.key === "End") {
      event.preventDefault();
      onChange(max);
    }
  };

  const angle = valueToAngle(value);
  const knob = pointOnCircle(angle, center, radius);
  const progressAngle = angle || 360;
  const { circumference, offset } = ringGeometry(radius, progressAngle / 360);

  return (
    <svg
      ref={svgRef}
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={ariaValueText(value)}
      tabIndex={disabled ? -1 : 0}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        className="fill-none stroke-muted"
        strokeWidth={10}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        className="fill-none stroke-primary"
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
      />
      <circle
        cx={knob.x}
        cy={knob.y}
        r={9}
        className="fill-primary stroke-background"
        strokeWidth={2}
      />
    </svg>
  );
}
