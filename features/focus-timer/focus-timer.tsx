"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { playChime } from "./lib/chime";
import { sessionEndSeconds, sliceAt, type IntervalPlan } from "./lib/cycle";
import { pickEncouragement } from "./lib/encouragements";
import { clampMinutes, formatTabTitle } from "./lib/time";
import { EndScreen } from "./components/end-screen";
import { MuteToggle } from "./components/mute-toggle";
import { RunningScreen } from "./components/running-screen";
import { SetupScreen } from "./components/setup-screen";
import { ThemeToggle } from "./components/theme-toggle";

type Phase = "setup" | "running" | "paused" | "ended";

const DEFAULT_MINUTES = 25;
const DEFAULT_INTERVAL_SECONDS = 60;
const TICK_MS = 250;
const BASE_TITLE = "집중 세션 타이머";

function secondsRemaining(target: number): number {
  return Math.max(0, Math.ceil((target - Date.now()) / 1000));
}

export function FocusTimer() {
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES);
  const [intervalEnabled, setIntervalEnabled] = useState(false);
  const [intervalPlan, setIntervalPlan] = useState<IntervalPlan>({
    first: DEFAULT_INTERVAL_SECONDS,
    second: DEFAULT_INTERVAL_SECONDS,
  });
  const [muted, setMuted] = useState(false);
  const [phase, setPhase] = useState<Phase>("setup");
  const [remainingSeconds, setRemainingSeconds] = useState(
    DEFAULT_MINUTES * 60
  );
  const [encouragement, setEncouragement] = useState("");
  const [blinking, setBlinking] = useState(false);
  // 총 시간에 닿는 순간 진행 중이던 구간을 채우고 끝나므로, 실제 세션 길이는
  // (구간 반복이 꺼져 있으면 minutes*60과 같지만) minutes*60보다 길어질 수
  // 있다. 지금 어느 구간인지는 이 값에서 remainingSeconds를 뺀 경과 시간으로
  // 역산한다.
  const [sessionTotalSeconds, setSessionTotalSeconds] = useState(
    DEFAULT_MINUTES * 60
  );

  const targetRef = useRef<number | null>(null);
  const remainingAtPauseRef = useRef(DEFAULT_MINUTES * 60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevSliceKindRef = useRef<"first" | "second" | null>(null);
  // tick()은 setInterval에 한 번 넘겨진 클로저라 매 렌더의 최신 state를 보지
  // 못한다. sessionTotalSeconds state는 화면 표시에, 이 ref는 tick 안의 계산에
  // 쓴다. handleStart에서 둘을 함께 갱신한다.
  const sessionTotalSecondsRef = useRef(DEFAULT_MINUTES * 60);

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const finishSession = useCallback(() => {
    clearTick();
    targetRef.current = null;
    setRemainingSeconds(0);
    setPhase("ended");
    setBlinking(true);
    setEncouragement(pickEncouragement());
    playChime("end", { muted });
  }, [clearTick, muted]);

  const tick = useCallback(() => {
    if (targetRef.current === null) return;
    const remaining = secondsRemaining(targetRef.current);
    setRemainingSeconds(remaining);
    if (intervalEnabled && remaining > 0) {
      const elapsed = sessionTotalSecondsRef.current - remaining;
      const kind = sliceAt(elapsed, intervalPlan).kind;
      if (prevSliceKindRef.current !== null && kind !== prevSliceKindRef.current) {
        playChime(kind === "first" ? "interval-first" : "interval-second", {
          muted,
        });
      }
      prevSliceKindRef.current = kind;
    }
    if (remaining <= 0) {
      finishSession();
    }
  }, [finishSession, intervalEnabled, intervalPlan, muted]);

  const startTicking = useCallback(() => {
    clearTick();
    intervalRef.current = setInterval(tick, TICK_MS);
  }, [clearTick, tick]);

  const handleStart = useCallback(() => {
    const totalSeconds = minutes * 60;
    const effectiveTotalSeconds = intervalEnabled
      ? sessionEndSeconds(totalSeconds, intervalPlan)
      : totalSeconds;
    sessionTotalSecondsRef.current = effectiveTotalSeconds;
    setSessionTotalSeconds(effectiveTotalSeconds);
    prevSliceKindRef.current = intervalEnabled ? "first" : null;
    targetRef.current = Date.now() + effectiveTotalSeconds * 1000;
    setRemainingSeconds(effectiveTotalSeconds);
    setPhase("running");
    playChime("start", { muted });
    startTicking();
  }, [minutes, intervalEnabled, intervalPlan, muted, startTicking]);

  const handleTogglePause = useCallback(() => {
    if (phase === "running" && targetRef.current !== null) {
      remainingAtPauseRef.current = secondsRemaining(targetRef.current);
      clearTick();
      setPhase("paused");
    } else if (phase === "paused") {
      targetRef.current = Date.now() + remainingAtPauseRef.current * 1000;
      setPhase("running");
      startTicking();
    }
  }, [phase, clearTick, startTicking]);

  const handleQuit = useCallback(() => {
    clearTick();
    targetRef.current = null;
    setPhase("setup");
    setRemainingSeconds(minutes * 60);
  }, [clearTick, minutes]);

  const handleMinutesChange = useCallback((next: number) => {
    setMinutes(clampMinutes(next));
  }, []);

  const handleToggleIntervalEnabled = useCallback(() => {
    setIntervalEnabled((value) => !value);
  }, []);

  useEffect(() => clearTick, [clearTick]);

  useEffect(() => {
    if (phase === "running" || phase === "paused") {
      document.title = formatTabTitle(remainingSeconds, title);
    } else {
      document.title = BASE_TITLE;
    }
  }, [phase, remainingSeconds, title]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex justify-end gap-2 p-4">
        <ThemeToggle />
        <MuteToggle muted={muted} onToggle={() => setMuted((m) => !m)} />
      </div>
      <div className="flex flex-1 items-center justify-center p-6 sm:p-16">
        {phase === "setup" && (
          <SetupScreen
            title={title}
            minutes={minutes}
            onTitleChange={setTitle}
            onMinutesChange={handleMinutesChange}
            intervalEnabled={intervalEnabled}
            onToggleIntervalEnabled={handleToggleIntervalEnabled}
            intervalPlan={intervalPlan}
            onIntervalPlanChange={setIntervalPlan}
            onStart={handleStart}
          />
        )}
        {(phase === "running" || phase === "paused") && (
          <RunningScreen
            title={title}
            remainingSeconds={remainingSeconds}
            totalSeconds={sessionTotalSeconds}
            phase={phase}
            onTogglePause={handleTogglePause}
            onQuit={handleQuit}
            slice={
              intervalEnabled
                ? sliceAt(
                    sessionTotalSeconds - remainingSeconds,
                    intervalPlan
                  )
                : undefined
            }
          />
        )}
        {phase === "ended" && (
          <EndScreen
            title={title}
            encouragement={encouragement}
            blinking={blinking}
            onDismissBlink={() => setBlinking(false)}
            onRestart={handleStart}
          />
        )}
      </div>
    </div>
  );
}
