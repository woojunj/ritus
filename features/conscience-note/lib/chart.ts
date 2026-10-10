import { LEVELS, VIRTUES, type VirtueKey } from "./form";

export const CHART_RADIUS = 90;

export type ChartPoint = { x: number; y: number };

const round = (value: number) => Math.round(value * 100) / 100 + 0;

/** 축의 각도와 중심에서의 거리로 도표 위 좌표를 구한다. */
export function polarPoint(angle: number, radius: number): ChartPoint {
  const radians = (angle * Math.PI) / 180;
  return {
    x: round(radius * Math.cos(radians)),
    y: round(radius * Math.sin(radians)),
  };
}

/** 단계가 놓이는 거리. 찜찜(0)은 중심, 자명(3)은 가장 바깥 원이다. */
export function levelRadius(level: number): number {
  return (CHART_RADIUS * level) / (LEVELS.length - 1);
}

/** 도표를 한 바퀴 도는 순서로 늘어놓은 덕목. */
export const AXES = [...VIRTUES].sort((a, b) => a.angle - b.angle);

/** 단계를 고른 덕목만, 축 순서대로 점으로 바꾼다. */
export function shapePoints(
  levels: Record<VirtueKey, number | null>
): (ChartPoint & { key: VirtueKey; level: number })[] {
  return AXES.flatMap((virtue) => {
    const level = levels[virtue.key];
    if (level === null) return [];
    return [{ key: virtue.key, level, ...polarPoint(virtue.angle, levelRadius(level)) }];
  });
}
