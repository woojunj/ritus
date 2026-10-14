import { describe, expect, test } from "vitest";

import { createNote, type ConscienceNoteItem } from "./storage";
import { matchedFieldLabels, matchesSignals, noteMatches } from "./search";

function sample(overrides: Partial<ConscienceNoteItem> = {}): ConscienceNoteItem {
  return {
    ...createNote(),
    matter: "약속에 늦었다",
    virtues: {
      ...createNote().virtues,
      immersion: { text: "서두르느라 깨어 있지 못했다", level: 2 },
      love: { text: "", level: null },
    },
    conclusion: "미리 나선다",
    ...overrides,
  };
}

describe("일치 규칙", () => {
  test("입력한 글자가 사안, 덕목 답, 최종 결론 어디에든 있으면 일치한다", () => {
    const note = sample();
    expect(noteMatches(note, ["약속"])).toBe(true);
    expect(noteMatches(note, ["깨어"])).toBe(true);
    expect(noteMatches(note, ["미리"])).toBe(true);
  });

  test("낱말을 모두 포함해야 일치한다. 하나라도 없으면 일치하지 않는다", () => {
    const note = sample();
    expect(noteMatches(note, ["약속", "늦"])).toBe(true);
    expect(noteMatches(note, ["약속", "사과"])).toBe(false);
  });

  test("조사가 붙은 한글도 일치한다", () => {
    expect(noteMatches(sample(), ["약속"])).toBe(true);
  });

  test("영문은 대소문자와 상관없이 일치한다", () => {
    const note = sample({ conclusion: "Say Sorry first" });
    expect(noteMatches(note, ["sorry"])).toBe(true);
    expect(noteMatches(note, ["SAY"])).toBe(true);
  });

  test("낱말이 없으면 모든 장이 일치한다", () => {
    expect(noteMatches(sample(), [])).toBe(true);
  });

  test("낱말은 서로 다른 칸에 있어도 된다", () => {
    expect(noteMatches(sample(), ["약속", "미리"])).toBe(true);
  });
});

describe("일치한 칸 이름", () => {
  test("낱말이 든 칸의 이름을 칸 순서대로 돌려준다", () => {
    expect(matchedFieldLabels(sample(), ["약속", "깨어"])).toEqual(["사안", "몰입"]);
    expect(matchedFieldLabels(sample(), ["미리"])).toEqual(["최종 결론"]);
  });

  test("낱말이 없으면 칸 이름을 돌려주지 않는다", () => {
    expect(matchedFieldLabels(sample(), [])).toEqual([]);
  });
});

describe("신호 칩으로 거르기", () => {
  test("켠 신호가 없으면 모든 장이 일치한다", () => {
    expect(matchesSignals(sample(), [])).toBe(true);
  });

  test("켠 신호 가운데 하나라도 고른 칸이 있으면 일치한다", () => {
    // 몰입 칸이 자찜(2)이다.
    expect(matchesSignals(sample(), [2])).toBe(true);
    expect(matchesSignals(sample(), [0, 2])).toBe(true);
    expect(matchesSignals(sample(), [0, 1])).toBe(false);
  });

  test("신호를 고르지 않은 장은 신호 칩에 걸리지 않는다", () => {
    const empty = sample({ virtues: { ...createNote().virtues } });
    expect(matchesSignals(empty, [0, 1, 2, 3])).toBe(false);
  });
});
