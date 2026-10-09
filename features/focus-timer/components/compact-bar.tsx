"use client";

import type { ReactNode } from "react";
import { Pause, Play, RotateCcw, Square, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { formatClock } from "../lib/time";
import { ProgressRing } from "./progress-ring";

interface CompactBarProps {
  phase: "setup" | "running" | "paused" | "ended";
  remainingSeconds: number;
  totalSeconds: number;
  onStart: () => void;
  onTogglePause: () => void;
  onQuit: () => void;
  onClose: () => void;
  /** 헤더 오른쪽에 두던 아이콘들(할 일 목록, 테마, 음소거) */
  icons: ReactNode;
}

// 메모장을 열었을 때 타이머가 줄어든 한 줄 바. 작은 링, 남은 시간, 조작 아이콘만 둔다.
export function CompactBar({
  phase,
  remainingSeconds,
  totalSeconds,
  onStart,
  onTogglePause,
  onQuit,
  onClose,
  icons,
}: CompactBarProps) {
  const fraction = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const isActive = phase === "running" || phase === "paused";

  return (
    <div className="flex items-center gap-1 border-b px-2 py-1 sm:px-4">
      <ProgressRing fraction={phase === "setup" ? 1 : fraction} size={28} strokeWidth={3} />
      <span
        role="timer"
        className="ml-1 mr-1 text-sm font-medium tabular-nums text-foreground"
      >
        {formatClock(remainingSeconds)}
      </span>

      {phase === "setup" && (
        <Button type="button" variant="ghost" size="icon" onClick={onStart}>
          <Play aria-hidden="true" />
          <span className="sr-only">시작</span>
        </Button>
      )}
      {isActive && (
        <>
          <Button type="button" variant="ghost" size="icon" onClick={onTogglePause}>
            {phase === "running" ? (
              <Pause aria-hidden="true" />
            ) : (
              <Play aria-hidden="true" />
            )}
            <span className="sr-only">
              {phase === "running" ? "일시정지" : "이어서"}
            </span>
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={onQuit}>
            <Square aria-hidden="true" />
            <span className="sr-only">그만두기</span>
          </Button>
        </>
      )}
      {phase === "ended" && (
        <Button type="button" variant="ghost" size="icon" onClick={onStart}>
          <RotateCcw aria-hidden="true" />
          <span className="sr-only">다시 시작</span>
        </Button>
      )}

      <div className="ml-auto flex items-center gap-1">
        {icons}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="메모장 닫기"
          onClick={onClose}
        >
          <X aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
