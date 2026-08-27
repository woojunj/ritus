"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

import { formatClock } from "../lib/time";

interface EndScreenProps {
  title: string;
  encouragement: string;
  blinking: boolean;
  onDismissBlink: () => void;
  onRestart: () => void;
}

export function EndScreen({
  title,
  encouragement,
  blinking,
  onDismissBlink,
  onRestart,
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

      <Button
        type="button"
        size="lg"
        onClick={(event) => {
          event.stopPropagation();
          onRestart();
        }}
      >
        <RotateCcw aria-hidden="true" />
        <span className="sr-only">다시 시작</span>
      </Button>
    </div>
  );
}
