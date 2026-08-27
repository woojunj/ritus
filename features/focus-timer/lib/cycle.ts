import { formatClock } from "./time";

export interface IntervalPlan {
  /** 첫 구간 길이(초) */
  first: number;
  /** 두 번째 구간 길이(초) */
  second: number;
}

export type SliceKind = "first" | "second";

export interface Slice {
  kind: SliceKind;
  /** 이 구간에 남은 시간(초) */
  remainingSeconds: number;
  /** 이 구간의 전체 길이(초) */
  sliceSeconds: number;
}

// 경과 시간을 사이클 안의 위치로 환산해 지금 어느 구간인지 알려준다.
export function sliceAt(elapsedSeconds: number, plan: IntervalPlan): Slice {
  const cycle = plan.first + plan.second;
  const within = elapsedSeconds % cycle;
  if (within < plan.first) {
    return {
      kind: "first",
      remainingSeconds: plan.first - within,
      sliceSeconds: plan.first,
    };
  }
  return {
    kind: "second",
    remainingSeconds: cycle - within,
    sliceSeconds: plan.second,
  };
}

export interface SliceCounts {
  first: number;
  second: number;
  endSeconds: number;
}

// 실제로 몇 사이클이 돌고, 마지막에 어느 구간이 몇 번째로 채워지는지 센다.
export function countSlices(
  totalSeconds: number,
  plan: IntervalPlan
): SliceCounts {
  const cycle = plan.first + plan.second;
  const fullCycles = Math.floor(totalSeconds / cycle);
  const elapsedFullCycles = fullCycles * cycle;

  if (elapsedFullCycles >= totalSeconds) {
    return { first: fullCycles, second: fullCycles, endSeconds: elapsedFullCycles };
  }
  // 총 시간이 이 사이클 안에서 끝나더라도, 구간1만 채우고 구간2를 건너뛰지 않도록
  // 구간2까지 마저 채운다.
  return {
    first: fullCycles + 1,
    second: fullCycles + 1,
    endSeconds: elapsedFullCycles + cycle,
  };
}

// 총 시간에 닿는 순간의 사이클은 구간2까지 채우므로, 실제 세션 길이는
// 그 사이클을 다 채운 경계가 된다.
export function sessionEndSeconds(
  totalSeconds: number,
  plan: IntervalPlan
): number {
  return countSlices(totalSeconds, plan).endSeconds;
}

// 구간 반복을 켜면 실제 세션 길이와 두 구간이 몇 번씩 도는지 한 줄로 보여준다.
export function formatCycleSummary(
  totalSeconds: number,
  plan: IntervalPlan
): string {
  const { first, second, endSeconds } = countSlices(totalSeconds, plan);
  return `총 ${formatClock(endSeconds)} · ${formatClock(plan.first)} ${first}번 / ${formatClock(plan.second)} ${second}번`;
}
