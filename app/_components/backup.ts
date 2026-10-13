import {
  getNotesSnapshot,
  normalizeNote,
  saveNotes,
  type ConscienceNoteItem,
} from "@/features/conscience-note";
import { getMemoSnapshot, saveMemo, type MemoDoc } from "@/features/memo-pad";
import {
  getTodosSnapshot,
  normalizeTodo,
  saveItems,
  type TodoItem,
} from "@/features/todo-list";
import { dateStamp, type TextFile } from "@/lib/download";

// 세 화면의 글을 한 파일로 묶은 것. 소리 끔과 테마는 기기마다 다를 수 있어 담지 않는다.
export type Backup = {
  conscienceNotes: ConscienceNoteItem[];
  memo: MemoDoc;
  todos: TodoItem[];
};

const APP = "ritus";
const VERSION = 1;

/** 지금 브라우저에 저장된 내용. */
export function currentBackup(): Backup {
  return {
    conscienceNotes: getNotesSnapshot(),
    memo: getMemoSnapshot(),
    todos: getTodosSnapshot(),
  };
}

/** 내려받을 백업 파일. 이름에는 저장한 날짜가 들어간다. */
export function backupFile(backup: Backup, now: Date = new Date()): TextFile {
  return {
    name: `ritus-backup-${dateStamp(now)}.json`,
    text: JSON.stringify(
      { app: APP, version: VERSION, savedAt: now.toISOString(), ...backup },
      null,
      2
    ),
    type: "application/json",
  };
}

/** backupFile이 만든 글을 다시 읽는다. ritus 백업 파일이 아니면 null. */
export function parseBackup(text: string): Backup | null {
  let data: unknown;
  try {
    data = JSON.parse(text.replace(/^﻿/, ""));
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  const { app, conscienceNotes, memo, todos } = data as Record<string, unknown>;
  if (app !== APP) return null;
  const doc = (typeof memo === "object" && memo !== null ? memo : {}) as Partial<MemoDoc>;
  return {
    // 항목마다 바로잡아, 망가진 파일을 불러와도 화면이 깨지지 않게 한다.
    conscienceNotes: Array.isArray(conscienceNotes)
      ? conscienceNotes.map(normalizeNote).filter((note) => note !== null)
      : [],
    memo: {
      text: typeof doc.text === "string" ? doc.text : "",
      format: doc.format === "md" ? "md" : "txt",
    },
    todos: Array.isArray(todos)
      ? todos.map(normalizeTodo).filter((todo) => todo !== null)
      : [],
  };
}

/** 지금 내용을 백업의 내용으로 바꾼다. 합치지 않는다. */
export function restoreBackup(backup: Backup): void {
  saveNotes(backup.conscienceNotes);
  saveMemo(backup.memo);
  saveItems(backup.todos);
}

/** "양심노트 3장, 할 일 5개, 메모 120자"처럼 무엇이 들었는지 한 줄로 적는다. */
export function backupSummary(backup: Backup): string {
  const memoLength = backup.memo.text.length;
  return [
    `양심노트 ${backup.conscienceNotes.length}장`,
    `할 일 ${backup.todos.length}개`,
    memoLength > 0 ? `메모 ${memoLength}자` : "메모 없음",
  ].join(", ");
}
