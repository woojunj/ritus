import { describe, expect, test } from "vitest";

import {
  addSaved,
  EMPTY_LIBRARY,
  memoTitle,
  normalizeLibrary,
  removeMemo,
  stashTemp,
} from "./library";

const doc = { text: "오늘 할 일\n둘째 줄", format: "txt" as const };

describe("저장 목록", () => {
  test("저장하면 맨 위에 한 장으로 더해진다", () => {
    const once = addSaved(EMPTY_LIBRARY, doc, "a", 1);
    const twice = addSaved(once, { text: "다음", format: "md" }, "b", 2);

    expect(twice.saved.map((memo) => memo.id)).toEqual(["b", "a"]);
    expect(twice.saved[0]).toMatchObject({ text: "다음", format: "md", savedAt: 2 });
  });

  test("임시 보관은 한 칸이고, 새로 넣으면 이전 것을 덮어쓴다", () => {
    const first = stashTemp(EMPTY_LIBRARY, doc, "t1", 1);
    const second = stashTemp(first, { text: "새 글", format: "txt" }, "t2", 2);

    expect(second.temp).toMatchObject({ id: "t2", text: "새 글" });
  });

  test("한 장을 지우면 목록에서 빠지고, 임시 보관본이면 임시 칸도 비운다", () => {
    const lib = stashTemp(addSaved(EMPTY_LIBRARY, doc, "a", 1), doc, "t", 2);

    expect(removeMemo(lib, "a").saved).toEqual([]);
    expect(removeMemo(lib, "t").temp).toBeNull();
    expect(removeMemo(lib, "t").saved.map((memo) => memo.id)).toEqual(["a"]);
  });

  test("제목은 글의 첫 비어 있지 않은 줄이다", () => {
    expect(memoTitle("\n  \n오늘 할 일\n둘째")).toBe("오늘 할 일");
    expect(memoTitle("   ")).toBe("");
  });
});

describe("저장 목록 읽기", () => {
  test("예전 백업처럼 항목이 없으면 빈 목록으로 읽는다", () => {
    expect(normalizeLibrary(undefined)).toEqual(EMPTY_LIBRARY);
    expect(normalizeLibrary({})).toEqual(EMPTY_LIBRARY);
  });

  test("모양이 틀린 한 장은 건너뛰고, 나머지는 그대로 읽는다", () => {
    const lib = normalizeLibrary({
      saved: [{ id: "ok", text: "글", format: "md", savedAt: 5 }, { id: 3, text: "틀림" }, "틀림"],
      temp: { id: "t", text: "임시", format: "nope", savedAt: "x" },
    });

    expect(lib.saved).toEqual([{ id: "ok", text: "글", format: "md", savedAt: 5 }]);
    expect(lib.temp).toEqual({ id: "t", text: "임시", format: "txt", savedAt: 0 });
  });
});
