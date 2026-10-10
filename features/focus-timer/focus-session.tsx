"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { playChime } from "./lib/chime";
import { sessionEndSeconds, sliceAt, type IntervalPlan } from "./lib/cycle";
import { pickEncouragement } from "./lib/encouragements";
import { useMuted } from "./lib/muted";
import { clampMinutes, formatTabTitle } from "./lib/time";

export type Phase = "setup" | "running" | "paused" | "ended";

const DEFAULT_MINUTES = 25;
const DEFAULT_FIRST_INTERVAL_SECONDS = 20;
const DEFAULT_SECOND_INTERVAL_SECONDS = 10;
const TICK_MS = 100;
const BASE_TITLE = "집중 세션 타이머";

function secondsRemaining(target: number): number {
  return Math.max(0, Math.ceil((target - Date.now()) / 1000));
}

interface FocusSession {
  phase: Phase;
  title: string;
  /** 이 세션을 시작한 할 일. 완주하면 이 할 일의 완주 횟수가 오른다. */
  todoId: string | undefined;
  minutes: number;
  intervalEnabled: boolean;
  intervalPlan: IntervalPlan;
  remainingSeconds: number;
  sessionTotalSeconds: number;
  /** 지금 설정으로 시작했을 때의 세션 길이 */
  setupSeconds: number;
  encouragement: string;
  blinking: boolean;
  setTitle: (title: string) => void;
  setMinutes: (minutes: number) => void;
  toggleIntervalEnabled: () => void;
  setIntervalPlan: (plan: IntervalPlan) => void;
  start: () => void;
  togglePause: () => void;
  quit: () => void;
  dismissBlink: () => void;
  /** 진행 중인 세션이 있으면 그만두고, 주어진 할 일로 설정 화면을 준비한다. */
  prepare: (next: { title: string; todoId: string }) => void;
}

const FocusSessionContext = createContext<FocusSession | null>(null);

export function useFocusSession(): FocusSession {
  const session = useContext(FocusSessionContext);
  if (!session) {
    throw new Error("useFocusSession은 FocusSessionProvider 안에서 써야 한다.");
  }
  return session;
}

interface FocusSessionProviderProps {
  children: ReactNode;
  /** 세션 완주 시 호출되는 콜백. 세션을 시작한 할 일이 있으면 그 id를 넘긴다. */
  onFinish?: (todoId: string | undefined) => void;
}

// 세션 상태를 화면보다 위에 둔다. 타이머, 메모장, 할 일 목록 어느 화면으로
// 옮겨도 이 Provider는 언마운트되지 않아 시간과 소리가 이어진다.
export function FocusSessionProvider({
  children,
  onFinish,
}: FocusSessionProviderProps) {
  const [title, setTitleState] = useState("");
  const [todoId, setTodoId] = useState<string | undefined>(undefined);

  const [minutes, setMinutesState] = useState(DEFAULT_MINUTES);
  const [intervalEnabled, setIntervalEnabled] = useState(false);
  const [intervalPlan, setIntervalPlan] = useState<IntervalPlan>({
    first: DEFAULT_FIRST_INTERVAL_SECONDS,
    second: DEFAULT_SECOND_INTERVAL_SECONDS,
  });

  const muted = useMuted();

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

  const todoIdRef = useRef(todoId);
  useEffect(() => {
    todoIdRef.current = todoId;
  }, [todoId]);

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
    onFinishRef.current?.(todoIdRef.current);
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

  const setupSeconds = intervalEnabled
    ? sessionEndSeconds(minutes * 60, intervalPlan)
    : minutes * 60;

  const start = useCallback(() => {
    sessionTotalSecondsRef.current = setupSeconds;
    setSessionTotalSeconds(setupSeconds);
    prevSliceKindRef.current = intervalEnabled ? "first" : null;
    targetRef.current = Date.now() + setupSeconds * 1000;
    setRemainingSeconds(setupSeconds);
    setPhase("running");
    playChime("start", { muted: mutedRef.current });
    startTicking();
  }, [setupSeconds, intervalEnabled, startTicking]);

  const togglePause = useCallback(() => {
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

  const quit = useCallback(() => {
    clearTick();
    targetRef.current = null;
    setPhase("setup");
    setRemainingSeconds(minutes * 60);
  }, [clearTick, minutes]);

  const prepare = useCallback(
    (next: { title: string; todoId: string }) => {
      quit();
      setTitleState(next.title);
      setTodoId(next.todoId);
    },
    [quit]
  );

  // 제목을 손으로 고치면 더는 그 할 일의 세션이 아니라고 본다.
  const setTitle = useCallback((next: string) => {
    setTitleState(next);
    setTodoId(undefined);
  }, []);

  const setMinutes = useCallback((next: number) => {
    setMinutesState(clampMinutes(next));
  }, []);

  const toggleIntervalEnabled = useCallback(() => {
    setIntervalEnabled((value) => !value);
  }, []);

  const dismissBlink = useCallback(() => setBlinking(false), []);

  useEffect(() => clearTick, [clearTick]);

  useEffect(() => {
    if (phase === "running" || phase === "paused") {
      document.title = formatTabTitle(remainingSeconds, title);
    } else {
      document.title = BASE_TITLE;
    }
  }, [phase, remainingSeconds, title]);

  return (
    <FocusSessionContext.Provider
      value={{
        phase,
        title,
        todoId,
        minutes,
        intervalEnabled,
        intervalPlan,
        remainingSeconds,
        sessionTotalSeconds,
        setupSeconds,
        encouragement,
        blinking,
        setTitle,
        setMinutes,
        toggleIntervalEnabled,
        setIntervalPlan,
        start,
        togglePause,
        quit,
        dismissBlink,
        prepare,
      }}
    >
      {children}
    </FocusSessionContext.Provider>
  );
}
