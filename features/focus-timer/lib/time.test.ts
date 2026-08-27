import { describe, expect, test } from "vitest";

import {
  clampIntervalSeconds,
  clampMinutes,
  formatClock,
  formatTabTitle,
  minutesToAngle,
  angleToMinutes,
  secondsToAngle,
  angleToSeconds,
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

describe("clampIntervalSeconds", () => {
  test("3초 미만은 3초로 붙는다", () => {
    expect(clampIntervalSeconds(0)).toBe(3);
    expect(clampIntervalSeconds(2)).toBe(3);
  });

  test("1시간을 넘으면 3600초로 붙는다", () => {
    expect(clampIntervalSeconds(3601)).toBe(3600);
  });

  test("범위 안에서는 1초 단위로 반올림한다", () => {
    expect(clampIntervalSeconds(3)).toBe(3);
    expect(clampIntervalSeconds(120.4)).toBe(120);
    expect(clampIntervalSeconds(59.6)).toBe(60);
  });
});

describe("secondsToAngle / angleToSeconds", () => {
  test("한 바퀴가 60초다", () => {
    expect(secondsToAngle(3)).toBe(18);
    expect(secondsToAngle(30)).toBe(180);
    expect(secondsToAngle(60)).toBe(0);
  });

  test("60초를 넘는 값도 한 바퀴를 다 채운 채로 남는다", () => {
    expect(secondsToAngle(120)).toBe(0);
    expect(secondsToAngle(150)).toBe(0);
  });

  test("각도에서 초로 되돌리면 같은 값을 가리킨다", () => {
    expect(angleToSeconds(18)).toBe(3);
    expect(angleToSeconds(180)).toBe(30);
    expect(angleToSeconds(0)).toBe(60);
    expect(angleToSeconds(360)).toBe(60);
  });

  test("3초 미만을 가리키는 각도는 3초로 붙는다", () => {
    expect(angleToSeconds(6)).toBe(3);
    expect(angleToSeconds(12)).toBe(3);
  });
});
