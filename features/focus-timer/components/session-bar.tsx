"use client";

import { Pause, Play, RotateCcw, Square } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useFocusSession } from "../focus-session";
import { formatClock } from "../lib/time";
import { ProgressRing } from "./progress-ring";

interface SessionBarProps {
  /**
   * 세션이 없을 때도 바를 보여 주고 지금 설정으로 시작할 수 있게 한다.
   * 끄면 세션이 돌거나, 일시정지됐거나, 막 끝났을 때만 보인다.
   */
  showWhenIdle?: boolean;
}

// 타이머 화면 밖에서 세션을 보여 주는 한 줄 바. 작은 링, 남은 시간, 조작 아이콘만 둔다.
export function SessionBar({ showWhenIdle = false }: SessionBarProps) {
  const {
    phase,
    remainingSeconds,
    sessionTotalSeconds,
    setupSeconds,
    start,
    togglePause,
    quit,
  } = useFocusSession();

  if (phase === "setup" && !showWhenIdle) return null;

  const shownSeconds = phase === "setup" ? setupSeconds : remainingSeconds;
  const fraction =
    sessionTotalSeconds > 0 ? remainingSeconds / sessionTotalSeconds : 0;
  const isActive = phase === "running" || phase === "paused";

  return (
    <div className="flex items-center gap-1 border-b px-2 py-1 sm:px-4">
      <ProgressRing fraction={phase === "setup" ? 1 : fraction} size={28} strokeWidth={3} />
      <span
        role="timer"
        className="ml-1 mr-1 text-sm font-medium tabular-nums text-foreground"
      >
        {formatClock(shownSeconds)}
      </span>

      {phase === "setup" && (
        <Button type="button" variant="ghost" size="icon" onClick={start}>
          <Play aria-hidden="true" />
          <span className="sr-only">시작</span>
        </Button>
      )}
      {isActive && (
        <>
          <Button type="button" variant="ghost" size="icon" onClick={togglePause}>
            {phase === "running" ? (
              <Pause aria-hidden="true" />
            ) : (
              <Play aria-hidden="true" />
            )}
            <span className="sr-only">
              {phase === "running" ? "일시정지" : "이어서"}
            </span>
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={quit}>
            <Square aria-hidden="true" />
            <span className="sr-only">그만두기</span>
          </Button>
        </>
      )}
      {phase === "ended" && (
        <Button type="button" variant="ghost" size="icon" onClick={start}>
          <RotateCcw aria-hidden="true" />
          <span className="sr-only">다시 시작</span>
        </Button>
      )}
    </div>
  );
}
