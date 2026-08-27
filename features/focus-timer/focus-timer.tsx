"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { playChime } from "./lib/chime";
import { pickEncouragement } from "./lib/encouragements";
import { clampMinutes, formatTabTitle } from "./lib/time";
import { EndScreen } from "./components/end-screen";
import { MuteToggle } from "./components/mute-toggle";
import { RunningScreen } from "./components/running-screen";
import { SetupScreen } from "./components/setup-screen";

type Phase = "setup" | "running" | "paused" | "ended";

const DEFAULT_MINUTES = 25;
const TICK_MS = 250;
const BASE_TITLE = "집중 세션 타이머";

function secondsRemaining(target: number): number {
  return Math.max(0, Math.ceil((target - Date.now()) / 1000));
}

export function FocusTimer() {
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES);
  const [muted, setMuted] = useState(false);
  const [phase, setPhase] = useState<Phase>("setup");
  const [remainingSeconds, setRemainingSeconds] = useState(
    DEFAULT_MINUTES * 60
  );
  const [encouragement, setEncouragement] = useState("");
  const [blinking, setBlinking] = useState(false);

  const targetRef = useRef<number | null>(null);
  const remainingAtPauseRef = useRef(DEFAULT_MINUTES * 60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    if (remaining <= 0) {
      finishSession();
    }
  }, [finishSession]);

  const startTicking = useCallback(() => {
    clearTick();
    intervalRef.current = setInterval(tick, TICK_MS);
  }, [clearTick, tick]);

  const handleStart = useCallback(() => {
    const totalSeconds = minutes * 60;
    targetRef.current = Date.now() + totalSeconds * 1000;
    setRemainingSeconds(totalSeconds);
    setPhase("running");
    playChime("start", { muted });
    startTicking();
  }, [minutes, muted, startTicking]);

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
      <div className="flex justify-end p-4">
        <MuteToggle muted={muted} onToggle={() => setMuted((m) => !m)} />
      </div>
      <div className="flex flex-1 items-center justify-center p-6 sm:p-16">
        {phase === "setup" && (
          <SetupScreen
            title={title}
            minutes={minutes}
            onTitleChange={setTitle}
            onMinutesChange={handleMinutesChange}
            onStart={handleStart}
          />
        )}
        {(phase === "running" || phase === "paused") && (
          <RunningScreen
            title={title}
            remainingSeconds={remainingSeconds}
            totalSeconds={minutes * 60}
            phase={phase}
            onTogglePause={handleTogglePause}
            onQuit={handleQuit}
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
