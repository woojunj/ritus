const MIN_MINUTES = 1;
const MAX_MINUTES = 60;

export function formatClock(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function clampMinutes(minutes: number): number {
  const rounded = Math.round(minutes);
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, rounded));
}

export function formatTabTitle(remainingSeconds: number, title: string): string {
  const clock = formatClock(remainingSeconds);
  const trimmed = title.trim();
  return trimmed ? `${clock} · ${trimmed}` : clock;
}

// 원 위쪽(12시 방향, 0도)이 60분을 가리키고 시계 방향으로 6도마다 1분씩 줄어든다.
export function minutesToAngle(minutes: number): number {
  const clamped = clampMinutes(minutes);
  return clamped === MAX_MINUTES ? 0 : clamped * 6;
}

export function angleToMinutes(angle: number): number {
  const normalized = ((angle % 360) + 360) % 360;
  const raw = Math.round(normalized / 6);
  const minutes = raw === 0 ? MAX_MINUTES : raw;
  return clampMinutes(minutes);
}
