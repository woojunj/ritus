"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";

import { formatClock } from "../lib/time";
import { ProgressRing } from "./progress-ring";

interface CurrentSlice {
  kind: "first" | "second";
  remainingSeconds: number;
}

interface RunningScreenProps {
  title: string;
  remainingSeconds: number;
  totalSeconds: number;
  phase: "running" | "paused";
  onTogglePause: () => void;
  onQuit: () => void;
  /** 두 구간 반복이 켜졌을 때 지금 구간의 정보. 꺼졌으면 undefined. */
  slice?: CurrentSlice;
}

const SLICE_LABEL: Record<CurrentSlice["kind"], string> = {
  first: "구간 1",
  second: "구간 2",
};

export function RunningScreen({
  title,
  remainingSeconds,
  totalSeconds,
  phase,
  onTogglePause,
  onQuit,
  slice,
}: RunningScreenProps) {
  const [showClock, setShowClock] = useState(true);
  const fraction = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="relative flex items-center justify-center">
        <ProgressRing fraction={fraction} />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-pressed={showClock}
        aria-label={showClock ? "숫자 가리기" : "숫자 보이기"}
        onClick={() => setShowClock((value) => !value)}
        className="gap-2"
      >
        {showClock ? (
          <span
            role="timer"
            className="text-lg font-medium tabular-nums text-foreground"
          >
            {formatClock(remainingSeconds)}
          </span>
        ) : null}
        {showClock ? (
          <EyeOff aria-hidden="true" className="size-4" />
        ) : (
          <Eye aria-hidden="true" className="size-4" />
        )}
      </Button>

      {slice && (
        <p
          data-testid="slice-indicator"
          className="text-sm text-muted-foreground"
        >
          {SLICE_LABEL[slice.kind]} · {formatClock(slice.remainingSeconds)}
        </p>
      )}

      {title.trim() && (
        <p className="max-w-xl text-center text-lg text-muted-foreground sm:text-2xl">
          {title}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onTogglePause}>
          {phase === "running" ? "일시정지" : "이어서"}
        </Button>
        <Button type="button" variant="ghost" onClick={onQuit}>
          그만두기
        </Button>
      </div>
    </div>
  );
}
