import { describe, expect, it } from "vitest";

import {
  countSlices,
  formatCycleSummary,
  sessionEndSeconds,
  sliceAt,
} from "./cycle";

describe("sessionEndSeconds", () => {
  it("총 시간에 닿는 순간 진행 중이던 구간을 끝까지 채운다", () => {
    // 25분(1500초) 안에서 2분/1분 반복 → 8사이클(1440초) 뒤 2분 구간이 돌던 중
    // 1500초에 닿으므로 그 구간을 채운 1560초에 끝난다.
    expect(sessionEndSeconds(1500, { first: 120, second: 60 })).toBe(1560);
  });

  it("총 시간이 사이클로 딱 떨어지면 그대로 끝난다", () => {
    expect(sessionEndSeconds(1440, { first: 120, second: 60 })).toBe(1440);
  });

  it("두 번째 구간 도중에 총 시간에 닿으면 그 구간을 채운다", () => {
    expect(sessionEndSeconds(1570, { first: 120, second: 60 })).toBe(1620);
  });

  it("구간이 총 시간보다 길면 첫 구간 하나만 돌고 끝난다", () => {
    expect(sessionEndSeconds(60, { first: 300, second: 120 })).toBe(300);
  });
});

describe("sliceAt", () => {
  const plan = { first: 120, second: 60 };

  it("세션 시작 직후에는 첫 구간이 통째로 남아 있다", () => {
    expect(sliceAt(0, plan)).toEqual({
      kind: "first",
      remainingSeconds: 120,
      sliceSeconds: 120,
    });
  });

  it("첫 구간이 끝나는 순간 두 번째 구간으로 넘어간다", () => {
    expect(sliceAt(120, plan)).toEqual({
      kind: "second",
      remainingSeconds: 60,
      sliceSeconds: 60,
    });
  });

  it("사이클이 끝나면 다시 첫 구간으로 돌아온다", () => {
    expect(sliceAt(180, plan)).toEqual({
      kind: "first",
      remainingSeconds: 120,
      sliceSeconds: 120,
    });
  });

  it("구간 도중이면 그 구간의 남은 시간을 알려준다", () => {
    expect(sliceAt(200, plan).kind).toBe("first");
    expect(sliceAt(200, plan).remainingSeconds).toBe(100);
    expect(sliceAt(160, plan).kind).toBe("second");
    expect(sliceAt(160, plan).remainingSeconds).toBe(20);
  });
});

describe("countSlices", () => {
  it("마지막 구간을 채우고 끝나므로 첫 구간이 한 번 더 돌 수 있다", () => {
    expect(countSlices(1500, { first: 120, second: 60 })).toEqual({
      first: 9,
      second: 8,
      endSeconds: 1560,
    });
  });

  it("사이클로 딱 떨어지면 두 구간이 같은 횟수로 돈다", () => {
    expect(countSlices(1440, { first: 120, second: 60 })).toEqual({
      first: 8,
      second: 8,
      endSeconds: 1440,
    });
  });

  it("구간이 총 시간보다 길면 첫 구간만 한 번 돈다", () => {
    expect(countSlices(60, { first: 300, second: 120 })).toEqual({
      first: 1,
      second: 0,
      endSeconds: 300,
    });
  });
});

describe("formatCycleSummary", () => {
  it("실제 세션 길이와 두 구간의 횟수를 한 줄로 알려준다", () => {
    expect(formatCycleSummary(1500, { first: 120, second: 60 })).toBe(
      "총 26:00 · 02:00 9번 / 01:00 8번"
    );
  });

  it("짧은 호흡 구간도 같은 형태로 알려준다", () => {
    expect(formatCycleSummary(60, { first: 3, second: 3 })).toBe(
      "총 01:00 · 00:03 10번 / 00:03 10번"
    );
  });
});
