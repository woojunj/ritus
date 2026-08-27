import { describe, expect, test } from "vitest";

import {
  clampMinutes,
  formatClock,
  formatTabTitle,
  minutesToAngle,
  angleToMinutes,
} from "./time";

describe("formatClock", () => {
  test("초를 mm:ss로 바꾼다", () => {
    expect(formatClock(1453)).toBe("24:13");
    expect(formatClock(60)).toBe("01:00");
    expect(formatClock(5)).toBe("00:05");
  });

  test("0 이하는 00:00으로 바닥을 찍는다", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(-3)).toBe("00:00");
  });
});

describe("clampMinutes", () => {
  test("1분 미만은 1로 올린다", () => {
    expect(clampMinutes(0)).toBe(1);
    expect(clampMinutes(-5)).toBe(1);
  });

  test("60분 초과는 60으로 내린다", () => {
    expect(clampMinutes(61)).toBe(60);
    expect(clampMinutes(120)).toBe(60);
  });

  test("범위 안이면 1분 단위로 반올림한다", () => {
    expect(clampMinutes(25)).toBe(25);
    expect(clampMinutes(25.6)).toBe(26);
  });
});

describe("formatTabTitle", () => {
  test("제목이 있으면 남은 시간과 함께 이어붙인다", () => {
    expect(formatTabTitle(1453, "결제 모듈 리팩터링")).toBe(
      "24:13 · 결제 모듈 리팩터링"
    );
  });

  test("제목이 비어 있으면 남은 시간만 보여준다", () => {
    expect(formatTabTitle(1453, "")).toBe("24:13");
    expect(formatTabTitle(1453, "   ")).toBe("24:13");
  });
});

describe("minutesToAngle / angleToMinutes", () => {
  test("각도와 분이 서로를 복원한다", () => {
    for (const minutes of [1, 6, 25, 40, 60]) {
      const angle = minutesToAngle(minutes);
      expect(angleToMinutes(angle)).toBe(minutes);
    }
  });

  test("angleToMinutes는 항상 1~60 범위로 잘린다", () => {
    expect(angleToMinutes(-10)).toBeGreaterThanOrEqual(1);
    expect(angleToMinutes(1000)).toBeLessThanOrEqual(60);
  });
});
