import { LEVELS, VIRTUES, type VirtueKey } from "./form";

export type VirtueEntry = {
  text: string;
  /** LEVELS의 인덱스. 고르지 않았으면 null */
  level: number | null;
};

export type ConscienceNoteItem = {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  matter: string;
  virtues: Record<VirtueKey, VirtueEntry>;
  conclusion: string;
  createdAt: number;
};

const STORAGE_KEY = "ritus:conscience-notes";

let cachedRaw: string | null = null;
let cachedParsed: ConscienceNoteItem[] = [];
const listeners = new Set<() => void>();

export function subscribeNotes(callback: () => void): () => void {
  listeners.add(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      cachedRaw = null;
      callback();
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }
  return () => {
    listeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

// useSyncExternalStore는 스냅샷 참조가 바뀌면 다시 그리므로, 빈 목록은 늘 같은 배열을 돌려준다.
const EMPTY: ConscienceNoteItem[] = [];

export function getNotesSnapshot(): ConscienceNoteItem[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? "";
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedParsed = raw ? (JSON.parse(raw) as ConscienceNoteItem[]) : [];
    }
    return cachedParsed;
  } catch {
    return EMPTY;
  }
}

export function getNotesServerSnapshot(): ConscienceNoteItem[] {
  return EMPTY;
}

export function saveNotes(notes: ConscienceNoteItem[]): void {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(notes);
    localStorage.setItem(STORAGE_KEY, serialized);
    cachedRaw = serialized;
    cachedParsed = notes;
    for (const listener of listeners) {
      listener();
    }
  } catch {
    // Ignore storage quota or disabled storage
  }
}

/** 기기 현지 날짜를 YYYY-MM-DD로 돌려준다. */
export function todayIso(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** "2026-10-11" → "2026년 10월 11일" */
export function formatNoteDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;
  return `${year}년 ${month}월 ${day}일`;
}

export function createNote(): ConscienceNoteItem {
  return {
    id: crypto.randomUUID(),
    date: todayIso(),
    matter: "",
    virtues: Object.fromEntries(
      VIRTUES.map((virtue) => [virtue.key, { text: "", level: null }])
    ) as Record<VirtueKey, VirtueEntry>,
    conclusion: "",
    createdAt: Date.now(),
  };
}

function textOf(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * 밖에서 들어온 값(백업 파일 등)을 한 장으로 바로잡는다. 객체가 아니면 null.
 * 모양이 맞지 않는 칸은 빈 값으로 바꿔, 화면이 깨지지 않게 한다.
 */
export function normalizeNote(value: unknown): ConscienceNoteItem | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  const note = createNote();
  const virtues = (typeof raw.virtues === "object" && raw.virtues !== null
    ? raw.virtues
    : {}) as Record<string, unknown>;
  for (const virtue of VIRTUES) {
    const entry = (virtues[virtue.key] ?? {}) as Record<string, unknown>;
    const level = entry.level;
    note.virtues[virtue.key] = {
      text: textOf(entry.text),
      level:
        Number.isInteger(level) && (level as number) >= 0 && (level as number) < LEVELS.length
          ? (level as number)
          : null,
    };
  }
  return {
    ...note,
    id: typeof raw.id === "string" && raw.id ? raw.id : note.id,
    date: typeof raw.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? raw.date : note.date,
    matter: textOf(raw.matter),
    conclusion: textOf(raw.conclusion),
    createdAt: Number.isFinite(raw.createdAt) ? (raw.createdAt as number) : note.createdAt,
  };
}

/** 한 장에서 덕목별로 고른 신호만 뽑는다. */
export function noteLevels(
  note: ConscienceNoteItem
): Record<VirtueKey, number | null> {
  return Object.fromEntries(
    VIRTUES.map((virtue) => [virtue.key, note.virtues[virtue.key].level])
  ) as Record<VirtueKey, number | null>;
}

/** 날짜가 최근인 것부터, 같은 날짜면 나중에 만든 것부터. */
export function sortNotes(notes: ConscienceNoteItem[]): ConscienceNoteItem[] {
  return [...notes].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt
  );
}
