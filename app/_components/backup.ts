import {
  getNotesSnapshot,
  normalizeNote,
  saveNotes,
  type ConscienceNoteItem,
} from "@/features/conscience-note";
import {
  getLibrarySnapshot,
  getMemoSnapshot,
  normalizeLibrary,
  saveLibrary,
  saveMemo,
  type MemoDoc,
  type MemoLibrary,
} from "@/features/memo-pad";
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
  /** 저장한 메모 목록과 임시 보관본. 예전 백업에는 없어서 빈 목록으로 읽는다. */
  memoLibrary: MemoLibrary;
  todos: TodoItem[];
};

const APP = "ritus";
const VERSION = 1;

/** 지금 브라우저에 저장된 내용. */
export function currentBackup(): Backup {
  return {
    conscienceNotes: getNotesSnapshot(),
    memo: getMemoSnapshot(),
    memoLibrary: getLibrarySnapshot(),
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

/** 백업 파일에서 모양이 맞지 않아 바로잡거나 건너뛴 항목의 수. */
export type BackupIssues = {
  notesRepaired: number;
  notesSkipped: number;
  todosRepaired: number;
  todosSkipped: number;
  memoRepaired: boolean;
};

// 항목마다 바로잡고, 바로잡은 수와 건너뛴 수를 센다.
function normalizeAll<T>(
  value: unknown,
  normalize: (item: unknown) => { item: T; repaired: boolean } | null
): { items: T[]; repaired: number; skipped: number } {
  const result = { items: [] as T[], repaired: 0, skipped: 0 };
  if (!Array.isArray(value)) return result;
  for (const raw of value) {
    const normalized = normalize(raw);
    if (!normalized) result.skipped += 1;
    else {
      result.items.push(normalized.item);
      if (normalized.repaired) result.repaired += 1;
    }
  }
  return result;
}

/**
 * backupFile이 만든 글을 다시 읽는다. ritus 백업 파일이 아니면 null.
 * 망가진 항목은 바로잡거나 건너뛰어 화면이 깨지지 않게 하고, 그 수를 issues로 알려 준다.
 */
export function parseBackup(text: string): { backup: Backup; issues: BackupIssues } | null {
  let data: unknown;
  try {
    data = JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  const { app, conscienceNotes, memo, memoLibrary, todos } = data as Record<string, unknown>;
  if (app !== APP) return null;
  const doc = (typeof memo === "object" && memo !== null ? memo : {}) as Partial<MemoDoc>;
  const notes = normalizeAll(conscienceNotes, normalizeNote);
  const todoItems = normalizeAll(todos, normalizeTodo);
  return {
    backup: {
      conscienceNotes: notes.items,
      memo: {
        text: typeof doc.text === "string" ? doc.text : "",
        format: doc.format === "md" ? "md" : "txt",
      },
      memoLibrary: normalizeLibrary(memoLibrary),
      todos: todoItems.items,
    },
    issues: {
      notesRepaired: notes.repaired,
      notesSkipped: notes.skipped,
      todosRepaired: todoItems.repaired,
      todosSkipped: todoItems.skipped,
      memoRepaired: typeof doc.text !== "string" || (doc.format !== "md" && doc.format !== "txt"),
    },
  };
}

// 마지막 글자에 받침이 있으면 "은", 없으면 "는".
function withTopic(word: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const hasFinal = code >= 0 && code <= 11171 && code % 28 !== 0;
  return `${word}${hasFinal ? "은" : "는"}`;
}

/**
 * 바로잡거나 건너뛴 것이 있으면 "양심노트 1장은 모양이 맞지 않는 칸을 비워서 넣고,
 * 할 일 1개는 읽을 수 없어 건너뜁니다."처럼 알린다. 없으면 null.
 */
export function backupIssueSummary(issues: BackupIssues): string | null {
  const list = (items: (string | false)[]) => items.filter(Boolean).join(", ");
  const repaired = list([
    issues.notesRepaired > 0 && `양심노트 ${issues.notesRepaired}장`,
    issues.todosRepaired > 0 && `할 일 ${issues.todosRepaired}개`,
    issues.memoRepaired && "메모",
  ]);
  const skipped = list([
    issues.notesSkipped > 0 && `양심노트 ${issues.notesSkipped}장`,
    issues.todosSkipped > 0 && `할 일 ${issues.todosSkipped}개`,
  ]);
  if (!repaired && !skipped) return null;
  const repairedPart = repaired && `${withTopic(repaired)} 모양이 맞지 않는 칸을 비워서 넣`;
  const skippedPart = skipped && `${withTopic(skipped)} 읽을 수 없어 건너뜁니다.`;
  const body =
    repairedPart && skippedPart
      ? `${repairedPart}고, ${skippedPart}`
      : repairedPart
        ? `${repairedPart}습니다.`
        : skippedPart;
  return `백업 파일의 일부가 망가져 있습니다. ${body}`;
}

/** 지금 내용을 백업의 내용으로 바꾼다. 합치지 않는다. */
export function restoreBackup(backup: Backup): void {
  saveNotes(backup.conscienceNotes);
  saveMemo(backup.memo);
  saveLibrary(backup.memoLibrary);
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
