import { describe, expect, test } from "vitest";

import { containsAllTerms, searchTerms } from "./search";

describe("검색어 나누기", () => {
  test("띄어쓰기로 나누고 빈 낱말은 버린다", () => {
    expect(searchTerms("  약속   늦 ")).toEqual(["약속", "늦"]);
    expect(searchTerms("   ")).toEqual([]);
  });

  test("소문자로 맞춘다", () => {
    expect(searchTerms("Hello WORLD")).toEqual(["hello", "world"]);
  });
});

describe("낱말 모두 포함 판단", () => {
  test("모든 낱말이 글 안에 있으면 참이다", () => {
    expect(containsAllTerms("약속에 늦었다", ["약속", "늦"])).toBe(true);
    expect(containsAllTerms("약속에 늦었다", ["약속", "사과"])).toBe(false);
  });

  test("대소문자와 상관없이 맞춘다", () => {
    expect(containsAllTerms("Say Sorry first", ["SORRY"])).toBe(true);
  });

  test("낱말이 없으면 항상 참이다", () => {
    expect(containsAllTerms("아무 글", [])).toBe(true);
  });
});
