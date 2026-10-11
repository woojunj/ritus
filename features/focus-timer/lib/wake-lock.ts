import { useEffect } from "react";

/**
 * active인 동안 화면이 저절로 꺼지지 않게 붙잡는다. 화면이 꺼지면 브라우저가
 * 타이머와 소리를 멈추므로, 세션이 도는 동안에는 화면을 켜 둔다.
 * 지원하지 않는 브라우저에서는 아무 일도 하지 않는다.
 */
export function useScreenWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      return;
    }

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        const next = await navigator.wakeLock.request("screen");
        if (cancelled) void next.release();
        else sentinel = next;
      } catch {
        // 배터리 절약 모드 등으로 거절되면 그대로 둔다.
      }
    };

    // 다른 탭이나 앱에 다녀오면 브라우저가 잠금을 풀어 버리므로 돌아왔을 때 다시 잡는다.
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void acquire();
    };

    void acquire();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      void sentinel?.release();
    };
  }, [active]);
}
