import { describe, expect, test } from "vitest";

import { countChars, cursorPosition, lineCount } from "./stats";

describe("cursorPosition", () => {
  test("빈 문서의 처음은 Ln 1, Col 1, Pos 1이다", () => {
    expect(cursorPosition("", 0)).toEqual({ line: 1, column: 1, position: 1 });
  });

  test("줄, 열, 위치를 1부터 세고 위치는 개행도 한 글자로 친다", () => {
    const text = "첫 줄\n둘째 줄\n셋";
    // "둘째" 다음, 즉 둘째 줄의 3번째 칸
    const offset = "첫 줄\n둘째".length;
    expect(cursorPosition(text, offset)).toEqual({ line: 2, column: 3, position: 7 });
  });

  test("다 앞의 커서는 Ln 2, Col 1, Pos 4다", () => {
    expect(cursorPosition("가나\n다", 3)).toEqual({ line: 2, column: 1, position: 4 });
  });

  test("이모지 하나는 한 칸으로 센다", () => {
    const text = "👍a";
    expect(cursorPosition(text, "👍".length)).toEqual({ line: 1, column: 2, position: 2 });
  });
});

describe("lineCount", () => {
  test("빈 문서는 1줄이다", () => {
    expect(lineCount("")).toBe(1);
  });

  test("개행 수보다 한 줄 많다", () => {
    expect(lineCount("a\nb\n")).toBe(3);
  });
});

describe("countChars", () => {
  test("전체 글자 수와 공백·개행을 뺀 글자 수를 센다", () => {
    expect(countChars("가 나\n다")).toEqual({ total: 5, withoutSpaces: 3 });
  });

  test("이모지와 조합 문자는 보이는 글자 단위로 센다", () => {
    expect(countChars("👨‍👩‍👧 한")).toEqual({ total: 3, withoutSpaces: 2 });
  });
});
