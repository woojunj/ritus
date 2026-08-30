"use client";

import { useState } from "react";
import { Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { IntervalPlan } from "../lib/cycle";
import { clampMinutes } from "../lib/time";
import { IntervalFields } from "./interval-fields";
import { IntervalToggle } from "./interval-toggle";
import { TimeDial } from "./time-dial";

interface SetupScreenProps {
  title: string;
  minutes: number;
  onTitleChange: (title: string) => void;
  onMinutesChange: (minutes: number) => void;
  intervalEnabled: boolean;
  onToggleIntervalEnabled: () => void;
  intervalPlan: IntervalPlan;
  onIntervalPlanChange: (plan: IntervalPlan) => void;
  onStart: () => void;
}

export function SetupScreen({
  title,
  minutes,
  onTitleChange,
  onMinutesChange,
  intervalEnabled,
  onToggleIntervalEnabled,
  intervalPlan,
  onIntervalPlanChange,
  onStart,
}: SetupScreenProps) {
  // 로컬 텍스트로 들고 있다가 유효한 값일 때만 커밋한다.
  // 그래야 값을 지우는 동안 Number("")가 0으로 읽혀 즉시 1분으로
  // 스냅되는 일 없이, 두 자리 수를 지우고 새로 입력할 수 있다.
  const [minutesText, setMinutesText] = useState(() => String(minutes));
  const [syncedMinutes, setSyncedMinutes] = useState(minutes);
  if (minutes !== syncedMinutes) {
    setSyncedMinutes(minutes);
    setMinutesText(String(minutes));
  }

  const fields = intervalEnabled ? (
    <IntervalFields
      plan={intervalPlan}
      onPlanChange={onIntervalPlanChange}
      totalSeconds={minutes * 60}
    />
  ) : null;

  return (
    <div className="flex w-full flex-col items-center gap-8 lg:max-w-3xl lg:flex-row lg:items-start lg:justify-center lg:gap-12">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <Input
          aria-label="세션 제목"
          placeholder="지금 무엇을 할까요?"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          className="text-center text-base"
        />

        <div className="relative flex items-center justify-center">
          <TimeDial minutes={minutes} onChange={onMinutesChange} />
          <div className="pointer-events-none absolute flex flex-col items-center">
            <span className="text-4xl font-semibold tabular-nums text-foreground">
              {minutes}
            </span>
            <span className="text-xs text-muted-foreground">분</span>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          직접 입력
          <Input
            type="number"
            aria-label="시간(분)"
            min={1}
            max={60}
            value={minutesText}
            onChange={(event) => {
              const raw = event.target.value;
              setMinutesText(raw);
              if (raw.trim() === "") return;
              const parsed = Number(raw);
              if (!Number.isNaN(parsed)) {
                onMinutesChange(clampMinutes(parsed));
              }
            }}
            onBlur={() => {
              const parsed = Number(minutesText);
              const next = Number.isNaN(parsed) ? minutes : clampMinutes(parsed);
              onMinutesChange(next);
              setMinutesText(String(next));
            }}
            className="w-16 text-center"
          />
        </label>

        <IntervalToggle enabled={intervalEnabled} onToggleEnabled={onToggleIntervalEnabled} />

        {fields && (
          <div data-testid="interval-fields-narrow" className="w-full lg:hidden">
            {fields}
          </div>
        )}

        <Button type="button" size="lg" className="w-full" onClick={onStart}>
          <Play aria-hidden="true" />
          <span className="sr-only">시작</span>
        </Button>
      </div>

      {fields && (
        <div
          data-testid="interval-fields-wide"
          className="hidden w-full max-w-[16rem] flex-col items-center lg:flex lg:pt-8"
        >
          {fields}
        </div>
      )}
    </div>
  );
}
