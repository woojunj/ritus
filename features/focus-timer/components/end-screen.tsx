"use client";

import { RotateCcw, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";

import { formatClock } from "../lib/time";

interface EndScreenProps {
  title: string;
  encouragement: string;
  blinking: boolean;
  onDismissBlink: () => void;
  onRestart: () => void;
  /** 설정 화면으로 돌아가 제목과 시간을 새로 정한다. */
  onNewSetup: () => void;
}

export function EndScreen({
  title,
  encouragement,
  blinking,
  onDismissBlink,
  onRestart,
  onNewSetup,
}: EndScreenProps) {
  return (
    <div
      data-testid="end-screen"
      data-blinking={blinking}
      onClick={onDismissBlink}
      className="flex w-full flex-col items-center gap-6 data-[blinking=true]:animate-pulse"
    >
      <div
        role="timer"
        className="font-heading font-semibold tabular-nums text-foreground"
        style={{ fontSize: "clamp(3rem, 18vw, 12rem)" }}
      >
        {formatClock(0)}
      </div>

      {title.trim() && (
        <p className="max-w-xl text-center text-lg text-muted-foreground sm:text-2xl">
          {title}
        </p>
      )}

      <p className="text-xl font-medium text-foreground sm:text-3xl">
        {encouragement}
      </p>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="lg"
          title="다시 시작"
          onClick={(event) => {
            event.stopPropagation();
            onRestart();
          }}
        >
          <RotateCcw aria-hidden="true" />
          <span className="sr-only">다시 시작</span>
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          title="새로 정하기"
          onClick={(event) => {
            event.stopPropagation();
            onNewSetup();
          }}
        >
          <SlidersHorizontal aria-hidden="true" />
          <span className="sr-only">새로 정하기</span>
        </Button>
      </div>
    </div>
  );
}
