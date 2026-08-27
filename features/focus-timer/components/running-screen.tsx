"use client";

import { Button } from "@/components/ui/button";

import { formatClock } from "../lib/time";

interface RunningScreenProps {
  title: string;
  remainingSeconds: number;
  phase: "running" | "paused";
  onTogglePause: () => void;
  onQuit: () => void;
}

export function RunningScreen({
  title,
  remainingSeconds,
  phase,
  onTogglePause,
  onQuit,
}: RunningScreenProps) {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div
        role="timer"
        className="font-heading font-semibold tabular-nums text-foreground"
        style={{ fontSize: "clamp(3rem, 18vw, 12rem)" }}
      >
        {formatClock(remainingSeconds)}
      </div>

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
