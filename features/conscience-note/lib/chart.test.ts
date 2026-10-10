import { describe, expect, test } from "vitest";

import { AXES, CHART_RADIUS, polarPoint, shapePoints } from "./chart";
import type { VirtueKey } from "./form";

const levelsOf = (level: number | null): Record<VirtueKey, number | null> => ({
  immersion: level,
  love: level,
  justice: level,
  propriety: level,
  sincerity: level,
  wisdom: level,
});

describe("방사형 도표", () => {
  test("축은 위 왼쪽부터 시계 방향으로 예절, 성실, 정의, 지혜, 몰입, 사랑이다", () => {
    const fromTopLeft = [...AXES.slice(4), ...AXES.slice(0, 4)];
    expect(fromTopLeft.map((virtue) => virtue.name)).toEqual([
      "예절",
      "성실",
      "정의",
      "지혜",
      "몰입",
      "사랑",
    ]);
    // 예절은 위 왼쪽, 사랑은 왼쪽 가운데다.
    const propriety = polarPoint(240, CHART_RADIUS);
    expect(propriety.x).toBeLessThan(0);
    expect(propriety.y).toBeLessThan(0);
    expect(polarPoint(180, CHART_RADIUS)).toEqual({ x: -CHART_RADIUS, y: 0 });
  });

  test("모두 자명이면 가장 바깥 육각형과 겹친다", () => {
    const outer = AXES.map((virtue) => polarPoint(virtue.angle, CHART_RADIUS));
    expect(shapePoints(levelsOf(3)).map(({ x, y }) => ({ x, y }))).toEqual(outer);
  });

  test("찜찜은 중심에 찍힌다", () => {
    for (const point of shapePoints(levelsOf(0))) {
      expect({ x: point.x, y: point.y }).toEqual({ x: 0, y: 0 });
    }
  });

  test("단계를 고르지 않은 덕목은 도형에 들어가지 않는다", () => {
    const points = shapePoints({ ...levelsOf(null), love: 2, wisdom: 1 });
    expect(points.map((point) => point.key)).toEqual(["wisdom", "love"]);
  });
});
