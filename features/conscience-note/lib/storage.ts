import { VIRTUES, type VirtueKey } from "./form";

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

export function getNotesSnapshot(): ConscienceNoteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? "";
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedParsed = raw ? (JSON.parse(raw) as ConscienceNoteItem[]) : [];
    }
    return cachedParsed;
  } catch {
    return [];
  }
}

const SERVER_EMPTY: ConscienceNoteItem[] = [];
export function getNotesServerSnapshot(): ConscienceNoteItem[] {
  return SERVER_EMPTY;
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

/** 한 장에서 덕목별로 고른 단계만 뽑는다. */
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
