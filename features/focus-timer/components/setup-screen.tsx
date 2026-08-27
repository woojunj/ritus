"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { clampMinutes } from "../lib/time";
import { TimeDial } from "./time-dial";

interface SetupScreenProps {
  title: string;
  minutes: number;
  onTitleChange: (title: string) => void;
  onMinutesChange: (minutes: number) => void;
  onStart: () => void;
}

export function SetupScreen({
  title,
  minutes,
  onTitleChange,
  onMinutesChange,
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

  return (
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

      <Button type="button" size="lg" className="w-full" onClick={onStart}>
        시작
      </Button>
    </div>
  );
}
