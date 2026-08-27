import { describe, expect, test } from "vitest";

import { ringGeometry } from "./ring";

describe("ringGeometry", () => {
  test("비율 1이면 dashoffset이 0이라 링이 꽉 찬다", () => {
    const { circumference, offset } = ringGeometry(100, 1);
    expect(offset).toBeCloseTo(0, 5);
    expect(circumference).toBeCloseTo(2 * Math.PI * 100, 5);
  });

  test("비율 0.5면 dashoffset이 둘레의 절반이다", () => {
    const { circumference, offset } = ringGeometry(100, 0.5);
    expect(offset).toBeCloseTo(circumference * 0.5, 5);
  });

  test("비율 0이면 dashoffset이 둘레 전체라 링이 완전히 빈다", () => {
    const { circumference, offset } = ringGeometry(100, 0);
    expect(offset).toBeCloseTo(circumference, 5);
  });

  test("범위를 벗어난 비율은 0~1로 잘린다", () => {
    expect(ringGeometry(100, -1).offset).toBeCloseTo(
      ringGeometry(100, 0).offset,
      5
    );
    expect(ringGeometry(100, 2).offset).toBeCloseTo(
      ringGeometry(100, 1).offset,
      5
    );
  });
});
