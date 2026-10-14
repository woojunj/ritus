import { describe, expect, test } from "vitest";

import { parseTodos, todosToCsv } from "./csv";
import type { TodoItem } from "./storage";

function item(title: string): TodoItem {
  return { id: title, title, completionCount: 1, createdAt: 0 };
}

// 내보낸 CSV를 다시 읽었을 때 제목이 그대로 돌아오는지 확인한다.
function roundTrip(title: string): string | undefined {
  const csv = todosToCsv([item(title)]);
  return parseTodos(csv, [])[0]?.title;
}

describe("수식 주입 막기", () => {
  test("=, +, -, @로 시작하는 제목은 앞에 '가 붙어 내보내진다", () => {
    const csv = todosToCsv([item("=SUM(A1)"), item("+1"), item("-5"), item("@cmd")]);

    expect(csv).toContain("'=SUM(A1),1");
    expect(csv).toContain("'+1,1");
    expect(csv).toContain("'-5,1");
    expect(csv).toContain("'@cmd,1");
  });

  test("보호한 제목은 다시 불러와도 원래 제목이 된다", () => {
    expect(roundTrip("=SUM(A1)")).toBe("=SUM(A1)");
    expect(roundTrip("-5")).toBe("-5");
  });

  test("'가 앞에 붙은 제목도 되돌릴 때 헷갈리지 않는다", () => {
    expect(roundTrip("'=x")).toBe("'=x");
    expect(roundTrip("''=x")).toBe("''=x");
  });

  test("보호 대상이 아닌 제목은 그대로 내보내고 그대로 읽는다", () => {
    expect(todosToCsv([item("글쓰기")])).toContain("글쓰기,1");
    expect(roundTrip("'글쓰기'")).toBe("'글쓰기'");
    expect(roundTrip("'글")).toBe("'글");
    expect(roundTrip("할 일 정리")).toBe("할 일 정리");
  });
});

describe("예전에 내려받은 파일", () => {
  test("'가 없는 =, - 제목은 그대로 읽힌다", () => {
    const legacy = "할 일,완주 횟수\n=SUM(A1),0\n-5,2";

    const items = parseTodos(legacy, []);

    expect(items.map((todo) => [todo.title, todo.completionCount])).toEqual([
      ["=SUM(A1)", 0],
      ["-5", 2],
    ]);
  });

  test("다시 내보내면 그 제목이 보호된다", () => {
    const items = parseTodos("할 일,완주 횟수\n=SUM(A1),0", []);

    expect(todosToCsv(items)).toContain("'=SUM(A1),0");
  });
});
