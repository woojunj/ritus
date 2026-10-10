"use client";

import { sliceAt } from "./lib/cycle";
import { EndScreen } from "./components/end-screen";
import { RunningScreen } from "./components/running-screen";
import { SetupScreen } from "./components/setup-screen";
import { useFocusSession } from "./focus-session";

// 타이머 화면. 세션 상태는 FocusSessionProvider가 쥐고, 여기서는 지금 단계에
// 맞는 화면만 그린다.
export function FocusTimer() {
  const session = useFocusSession();
  const { phase } = session;

  return (
    <div className="flex flex-1 items-center justify-center p-6 sm:p-16">
      {phase === "setup" && (
        <SetupScreen
          title={session.title}
          minutes={session.minutes}
          onTitleChange={session.setTitle}
          onMinutesChange={session.setMinutes}
          intervalEnabled={session.intervalEnabled}
          onToggleIntervalEnabled={session.toggleIntervalEnabled}
          intervalPlan={session.intervalPlan}
          onIntervalPlanChange={session.setIntervalPlan}
          onStart={session.start}
        />
      )}
      {(phase === "running" || phase === "paused") && (
        <RunningScreen
          title={session.title}
          remainingSeconds={session.remainingSeconds}
          totalSeconds={session.sessionTotalSeconds}
          phase={phase}
          onTogglePause={session.togglePause}
          onQuit={session.quit}
          slice={
            session.intervalEnabled
              ? sliceAt(
                  session.sessionTotalSeconds - session.remainingSeconds,
                  session.intervalPlan
                )
              : undefined
          }
        />
      )}
      {phase === "ended" && (
        <EndScreen
          title={session.title}
          encouragement={session.encouragement}
          blinking={session.blinking}
          onDismissBlink={session.dismissBlink}
          onRestart={session.start}
        />
      )}
    </div>
  );
}
