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

  test("망가진 항목은 바로잡거나 건너뛰어, 화면이 깨지지 않는 모양으로만 읽는다", () => {
    const backup = parseBackup(
      JSON.stringify({
        app: "ritus",
        conscienceNotes: [
          { id: "x", date: "2026-10-13", matter: { a: 1 }, virtues: { love: { text: 3, level: 9 } } },
          "한 장이 아님",
        ],
        memo: {},
        todos: [{ title: "글쓰기", completionCount: "많이" }, { title: 1 }, null],
      })
    );

    expect(backup?.conscienceNotes).toHaveLength(1);
    const note = backup!.conscienceNotes[0];
    expect(note.id).toBe("x");
    expect(note.date).toBe("2026-10-13");
    expect(note.matter).toBe("");
    expect(note.virtues.love).toEqual({ text: "", level: null });
    expect(note.virtues.wisdom).toEqual({ text: "", level: null });
    expect(note.conclusion).toBe("");

    expect(backup?.todos).toHaveLength(1);
    expect(backup!.todos[0]).toMatchObject({ title: "글쓰기", completionCount: 0 });
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
