import { describe, expect, test } from "vitest";

import { ENCOURAGEMENTS, pickEncouragement } from "./encouragements";

describe("pickEncouragement", () => {
  test("무작위 함수의 결과로 목록에서 하나를 고른다", () => {
    expect(pickEncouragement(() => 0)).toBe(ENCOURAGEMENTS[0]);
    expect(pickEncouragement(() => 0.999)).toBe(
      ENCOURAGEMENTS[ENCOURAGEMENTS.length - 1]
    );
  });

  test("메시지 목록은 두 개 이상이다", () => {
    expect(ENCOURAGEMENTS.length).toBeGreaterThan(1);
  });
});
