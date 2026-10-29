import { beforeEach, describe, expect, test } from "vitest";

import {
  backupFile,
  backupIssueSummary,
  backupSummary,
  currentBackup,
  parseBackup,
  restoreBackup,
  type Backup,
} from "./backup";

const SAMPLE: Backup = {
  conscienceNotes: [],
  memo: { text: "오늘 할 것", format: "md" },
  memoLibrary: { saved: [], temp: null },
  todos: [{ id: "a", title: "글쓰기", completionCount: 2, createdAt: 1 }],
};

beforeEach(() => {
  localStorage.clear();
});

describe("전체 백업", () => {
  test("할 일 완료 체크를 백업하고 복원하며 이전 자료의 누락 값은 미체크로 읽는다", () => {
    const checked = { ...SAMPLE, todos: [{ ...SAMPLE.todos[0], completed: true }] };
    const parsed = parseBackup(backupFile(checked).text)!;
    expect(parsed.backup.todos[0]).toMatchObject({ completed: true, completionCount: 2 });
    expect(backupIssueSummary(parsed.issues)).toBeNull();
    restoreBackup(parsed.backup);
    expect(currentBackup().todos[0].completed).toBe(true);

    const legacy = parseBackup(backupFile(SAMPLE).text)!;
    restoreBackup(legacy.backup);
    expect(currentBackup().todos[0].completed ?? false).toBe(false);
    expect(currentBackup().todos[0]).toMatchObject({ title: "글쓰기", completionCount: 2 });
    expect(backupIssueSummary(legacy.issues)).toBeNull();
  });
  test("저장한 파일을 다시 읽으면 같은 내용이 돌아온다", () => {
    const file = backupFile(SAMPLE, new Date(2026, 9, 13));

    expect(file.name).toBe("ritus-backup-20261013.json");
    const parsed = parseBackup(file.text);
    expect(parsed?.backup).toEqual(SAMPLE);
    expect(backupIssueSummary(parsed!.issues)).toBeNull();
  });

  test("멀쩡한 양심노트가 든 파일은 망가졌다고 하지 않는다", () => {
    const entry = { text: "", level: null };
    const note = {
      id: "n",
      date: "2026-10-13",
      matter: "약속에 늦었다",
      virtues: {
        immersion: { text: "서둘렀다", level: 2 },
        love: entry,
        justice: entry,
        propriety: entry,
        sincerity: entry,
        wisdom: entry,
      },
      conclusion: "",
      createdAt: 1,
    };
    const parsed = parseBackup(backupFile({ ...SAMPLE, conscienceNotes: [note] }).text);

    expect(parsed?.backup.conscienceNotes).toEqual([note]);
    expect(backupIssueSummary(parsed!.issues)).toBeNull();
  });

  test("ritus 백업 파일이 아니면 읽지 않는다", () => {
    expect(parseBackup("약속에 늦었다")).toBeNull();
    expect(parseBackup(JSON.stringify({ todos: [] }))).toBeNull();
  });

  test("망가진 항목은 바로잡거나 건너뛰어, 화면이 깨지지 않는 모양으로만 읽는다", () => {
    const parsed = parseBackup(
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

    const backup = parsed!.backup;
    expect(backup.conscienceNotes).toHaveLength(1);
    const note = backup.conscienceNotes[0];
    expect(note.id).toBe("x");
    expect(note.date).toBe("2026-10-13");
    expect(note.matter).toBe("");
    expect(note.virtues.love).toEqual({ text: "", level: null });
    expect(note.virtues.wisdom).toEqual({ text: "", level: null });
    expect(note.conclusion).toBe("");

    expect(backup.todos).toHaveLength(1);
    expect(backup.todos[0]).toMatchObject({ title: "글쓰기", completionCount: 0 });

    expect(backupIssueSummary(parsed!.issues)).toBe(
      "백업 파일의 일부가 망가져 있습니다. 양심노트 1장, 할 일 1개, 메모는 모양이 맞지 않는 칸을 비워서 넣고, 양심노트 1장, 할 일 2개는 읽을 수 없어 건너뜁니다."
    );
  });

  test("바로잡은 것만 있거나 건너뛴 것만 있어도 문장이 자연스럽다", () => {
    const base = { notesRepaired: 0, notesSkipped: 0, todosRepaired: 0, todosSkipped: 0, memoRepaired: false };
    expect(backupIssueSummary({ ...base, notesRepaired: 1 })).toBe(
      "백업 파일의 일부가 망가져 있습니다. 양심노트 1장은 모양이 맞지 않는 칸을 비워서 넣습니다."
    );
    expect(backupIssueSummary({ ...base, todosSkipped: 3 })).toBe(
      "백업 파일의 일부가 망가져 있습니다. 할 일 3개는 읽을 수 없어 건너뜁니다."
    );
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

describe("저장한 메모 백업", () => {
  test("저장한 메모와 임시 보관본이 파일에 담겨 되살아난다", () => {
    const memoLibrary = {
      saved: [{ id: "s", text: "첫 메모", format: "txt" as const, savedAt: 3 }],
      temp: { id: "t", text: "둘째", format: "md" as const, savedAt: 4 },
    };
    const parsed = parseBackup(backupFile({ ...SAMPLE, memoLibrary }).text);

    expect(parsed?.backup.memoLibrary).toEqual(memoLibrary);
  });

  test("저장한 메모 항목이 없는 예전 백업은 빈 목록으로 읽는다", () => {
    const legacy = JSON.stringify({ app: "ritus", conscienceNotes: [], memo: SAMPLE.memo, todos: [] });

    expect(parseBackup(legacy)?.backup.memoLibrary).toEqual({ saved: [], temp: null });
  });
});
