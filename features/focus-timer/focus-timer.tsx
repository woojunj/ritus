"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ListTodo, ChevronLeft } from "lucide-react";

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
const DEFAULT_FIRST_INTERVAL_SECONDS = 20;
const DEFAULT_SECOND_INTERVAL_SECONDS = 10;
const TICK_MS = 100;
const BASE_TITLE = "집중 세션 타이머";
const MUTED_STORAGE_KEY = "ritus:muted";

const mutedListeners = new Set<() => void>();

function subscribeMuted(callback: () => void): () => void {
  mutedListeners.add(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === MUTED_STORAGE_KEY || e.key === null) {
      callback();
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }
  return () => {
    mutedListeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function getMutedSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(MUTED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function getMutedServerSnapshot(): boolean {
  return false;
}

function setMutedStorage(next: boolean) {
  try {
    localStorage.setItem(MUTED_STORAGE_KEY, String(next));
  } catch {
    // Ignore
  }
  for (const listener of mutedListeners) {
    listener();
  }
}

function secondsRemaining(target: number): number {
  return Math.max(0, Math.ceil((target - Date.now()) / 1000));
}

interface FocusTimerProps {
  /** 제공 시 헤더 왼쪽에 뒤로가기 링크를 표시한다. */
  backHref?: string;
  /** 제공 시 헤더에 할 일 목록으로 이동하는 링크를 표시한다. */
  todoHref?: string;
  /** 초기 타이머 제목 (예: 할 일에서 넘어온 제목) */
  initialTitle?: string;
  /** 세션 완주 시 호출되는 콜백 */
  onFinish?: () => void;
}

export function FocusTimer({
  backHref,
  todoHref,
  initialTitle,
  onFinish,
}: FocusTimerProps = {}) {
  const [title, setTitle] = useState(initialTitle ?? "");
  const [prevInitialTitle, setPrevInitialTitle] = useState(initialTitle);
  if (initialTitle !== prevInitialTitle) {
    setPrevInitialTitle(initialTitle);
    setTitle(initialTitle ?? "");
  }

  const [minutes, setMinutes] = useState(DEFAULT_MINUTES);
  const [intervalEnabled, setIntervalEnabled] = useState(false);
  const [intervalPlan, setIntervalPlan] = useState<IntervalPlan>({
    first: DEFAULT_FIRST_INTERVAL_SECONDS,
    second: DEFAULT_SECOND_INTERVAL_SECONDS,
  });

  const muted = useSyncExternalStore(
    subscribeMuted,
    getMutedSnapshot,
    getMutedServerSnapshot
  );

  const [phase, setPhase] = useState<Phase>("setup");
  const [remainingSeconds, setRemainingSeconds] = useState(
    DEFAULT_MINUTES * 60
  );
  const [encouragement, setEncouragement] = useState("");
  const [blinking, setBlinking] = useState(false);
  const [sessionTotalSeconds, setSessionTotalSeconds] = useState(
    DEFAULT_MINUTES * 60
  );

  const targetRef = useRef<number | null>(null);
  const remainingAtPauseRef = useRef(DEFAULT_MINUTES * 60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevSliceKindRef = useRef<"first" | "second" | null>(null);
  const sessionTotalSecondsRef = useRef(DEFAULT_MINUTES * 60);

  const mutedRef = useRef(muted);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);


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
    playChime("end", { muted: mutedRef.current });
    onFinishRef.current?.();
  }, [clearTick]);

  const tick = useCallback(() => {
    if (targetRef.current === null) return;
    const remaining = secondsRemaining(targetRef.current);
    setRemainingSeconds(remaining);
    if (intervalEnabled && remaining > 0) {
      const elapsed = sessionTotalSecondsRef.current - remaining;
      const kind = sliceAt(elapsed, intervalPlan).kind;
      if (prevSliceKindRef.current !== null && kind !== prevSliceKindRef.current) {
        playChime(kind === "first" ? "interval-first" : "interval-second", {
          muted: mutedRef.current,
        });
      }
      prevSliceKindRef.current = kind;
    }
    if (remaining <= 0) {
      finishSession();
    }
  }, [finishSession, intervalEnabled, intervalPlan]);

  // 최신 tick 콜백을 참조하는 ref 패턴으로 setInterval 내 stale closure 문제 방지
  const tickRef = useRef(tick);
  useEffect(() => {
    tickRef.current = tick;
  });

  const startTicking = useCallback(() => {
    clearTick();
    intervalRef.current = setInterval(() => {
      tickRef.current();
    }, TICK_MS);
  }, [clearTick]);

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
    playChime("start", { muted: mutedRef.current });
    startTicking();
  }, [minutes, intervalEnabled, intervalPlan, startTicking]);

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
      <div className="flex items-center justify-between p-4">
        {backHref ? (
          <Link
            href={backHref}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="할 일 목록으로 돌아가기"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            목록
          </Link>
        ) : (
          <span className="font-heading text-lg font-semibold tracking-tight">
            ritus
          </span>
        )}
        <div className="flex items-center gap-2">
          {todoHref && (
            <Link
              href={todoHref}
              className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="할 일 목록"
            >
              <ListTodo className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
          <ThemeToggle />
          <MuteToggle
            muted={muted}
            onToggle={() => setMutedStorage(!muted)}
          />
        </div>
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
