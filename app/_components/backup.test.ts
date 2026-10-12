import { beforeEach, describe, expect, test } from "vitest";

import {
  backupFile,
  backupSummary,
  currentBackup,
  parseBackup,
  restoreBackup,
  type Backup,
} from "./backup";

const SAMPLE: Backup = {
  conscienceNotes: [],
  memo: { text: "오늘 할 것", format: "md" },
  todos: [{ id: "a", title: "글쓰기", completionCount: 2, createdAt: 1 }],
};

beforeEach(() => {
  localStorage.clear();
});

describe("전체 백업", () => {
  test("저장한 파일을 다시 읽으면 같은 내용이 돌아온다", () => {
    const file = backupFile(SAMPLE, new Date(2026, 9, 13));

    expect(file.name).toBe("ritus-backup-20261013.json");
    expect(parseBackup(file.text)).toEqual(SAMPLE);
  });

  test("ritus 백업 파일이 아니면 읽지 않는다", () => {
    expect(parseBackup("약속에 늦었다")).toBeNull();
    expect(parseBackup(JSON.stringify({ todos: [] }))).toBeNull();
  });

  test("되살리면 지금 내용이 백업의 내용으로 바뀐다", () => {
    restoreBackup({
      ...SAMPLE,
      todos: [{ id: "b", title: "읽기", completionCount: 0, createdAt: 2 }],
    });
    restoreBackup(SAMPLE);

    expect(currentBackup()).toEqual(SAMPLE);
  });

  test("무엇이 들었는지 한 줄로 적는다", () => {
    expect(backupSummary(SAMPLE)).toBe("양심노트 0장, 할 일 1개, 메모 6자");
    expect(backupSummary({ ...SAMPLE, memo: { text: "", format: "txt" } })).toBe(
      "양심노트 0장, 할 일 1개, 메모 없음"
    );
  });
});
