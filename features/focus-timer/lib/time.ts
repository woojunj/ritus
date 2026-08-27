const MIN_MINUTES = 1;
const MAX_MINUTES = 60;
export const MIN_INTERVAL_SECONDS = 3;
export const MAX_INTERVAL_SECONDS = 3600;

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

// 반복 구간 하나의 길이. 명상의 한 호흡(3초)부터 1시간까지 같은 방식으로 다룬다.
export function clampIntervalSeconds(seconds: number): number {
  const rounded = Math.round(seconds);
  return Math.min(
    MAX_INTERVAL_SECONDS,
    Math.max(MIN_INTERVAL_SECONDS, rounded)
  );
}

export function formatTabTitle(remainingSeconds: number, title: string): string {
  const clock = formatClock(remainingSeconds);
  const trimmed = title.trim();
  return trimmed ? `${clock} · ${trimmed}` : clock;
}

// 큰 다이얼(한 바퀴 60분)과 작은 다이얼(한 바퀴 60초)이 같은 눈금을 쓴다.
// 원 위쪽(12시 방향, 0도)이 한 바퀴 전체를 가리키고 시계 방향으로 6도마다
// 한 눈금씩 줄어든다.
const UNITS_PER_TURN = 60;
const DEGREES_PER_UNIT = 360 / UNITS_PER_TURN;

function unitsToAngle(units: number): number {
  const within = units % UNITS_PER_TURN;
  return within * DEGREES_PER_UNIT;
}

function angleToUnits(angle: number): number {
  const normalized = ((angle % 360) + 360) % 360;
  const raw = Math.round(normalized / DEGREES_PER_UNIT);
  return raw === 0 ? UNITS_PER_TURN : raw;
}

export function minutesToAngle(minutes: number): number {
  return unitsToAngle(clampMinutes(minutes));
}

export function angleToMinutes(angle: number): number {
  return clampMinutes(angleToUnits(angle));
}

// 60초를 넘는 구간은 한 바퀴를 다 채운 채로 남는다.
export function secondsToAngle(seconds: number): number {
  return seconds >= UNITS_PER_TURN ? 0 : unitsToAngle(seconds);
}

export function angleToSeconds(angle: number): number {
  return clampIntervalSeconds(angleToUnits(angle));
}
