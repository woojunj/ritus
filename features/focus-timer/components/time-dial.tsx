"use client";

import { useCallback, useRef } from "react";

import { angleToMinutes, minutesToAngle } from "../lib/time";

interface TimeDialProps {
  minutes: number;
  onChange: (minutes: number) => void;
  disabled?: boolean;
}

const SIZE = 220;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2 - 12;

function pointOnCircle(angleDeg: number) {
  // 0도가 12시 방향이 되도록 90도를 뺀다.
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CENTER + RADIUS * Math.cos(rad),
    y: CENTER + RADIUS * Math.sin(rad),
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

export function TimeDial({ minutes, onChange, disabled }: TimeDialProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const draggingRef = useRef(false);

  const applyPointer = useCallback(
    (event: { clientX: number; clientY: number }) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const angle = angleFromPointerEvent(event, rect);
      onChange(angleToMinutes(angle));
    },
    [onChange]
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
    if (!draggingRef.current) return;
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
      onChange(Math.min(60, minutes + 1));
    } else if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
      event.preventDefault();
      onChange(Math.max(1, minutes - 1));
    } else if (event.key === "Home") {
      event.preventDefault();
      onChange(1);
    } else if (event.key === "End") {
      event.preventDefault();
      onChange(60);
    }
  };

  const knob = pointOnCircle(minutesToAngle(minutes));
  const progressAngle = minutesToAngle(minutes) || 360;

  return (
    <svg
      ref={svgRef}
      role="slider"
      aria-label="시간 다이얼"
      aria-valuemin={1}
      aria-valuemax={60}
      aria-valuenow={minutes}
      aria-valuetext={`${minutes}분`}
      tabIndex={disabled ? -1 : 0}
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
    >
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RADIUS}
        className="fill-none stroke-muted"
        strokeWidth={10}
      />
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RADIUS}
        className="fill-none stroke-primary"
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={2 * Math.PI * RADIUS}
        strokeDashoffset={
          2 * Math.PI * RADIUS * (1 - progressAngle / 360)
        }
        transform={`rotate(-90 ${CENTER} ${CENTER})`}
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
