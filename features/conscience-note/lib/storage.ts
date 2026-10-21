import { createBrowserStore } from "@/lib/browser-store";

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

const store = createBrowserStore<ConscienceNoteItem[]>({
  key: "ritus:conscience-notes",
  empty: [],
  parse: (raw) => raw ? JSON.parse(raw) as ConscienceNoteItem[] : [],
  readError: "empty",
});

export const subscribeNotes = store.subscribe;
export const getNotesSnapshot = store.getSnapshot;
export const getNotesServerSnapshot = store.getServerSnapshot;
export const saveNotes = store.save;

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

/**
 * 밖에서 들어온 값(백업 파일 등)을 한 장으로 바로잡는다. 객체가 아니면 null.
 * 모양이 맞지 않는 칸은 빈 값으로 바꿔 화면이 깨지지 않게 하고, 바꾼 칸이 있으면 repaired다.
 */
export function normalizeNote(
  value: unknown
): { item: ConscienceNoteItem; repaired: boolean } | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  const note = createNote();
  let repaired = false;
  const pick = <T,>(ok: boolean, valid: T, fallback: T): T => {
    if (!ok) repaired = true;
    return ok ? valid : fallback;
  };

  const virtues = (typeof raw.virtues === "object" && raw.virtues !== null
    ? raw.virtues
    : {}) as Record<string, unknown>;
  for (const virtue of VIRTUES) {
    const entry = (virtues[virtue.key] ?? {}) as Record<string, unknown>;
    const level = entry.level;
    const levelOk =
      level === null ||
      (Number.isInteger(level) && (level as number) >= 0 && (level as number) < LEVELS.length);
    note.virtues[virtue.key] = {
      text: pick(typeof entry.text === "string", entry.text as string, ""),
      level: pick(levelOk, level as number | null, null),
    };
  }
  const item: ConscienceNoteItem = {
    ...note,
    id: pick(typeof raw.id === "string" && raw.id !== "", raw.id as string, note.id),
    date: pick(
      typeof raw.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.date),
      raw.date as string,
      note.date
    ),
    matter: pick(typeof raw.matter === "string", raw.matter as string, ""),
    conclusion: pick(typeof raw.conclusion === "string", raw.conclusion as string, ""),
    createdAt: pick(Number.isFinite(raw.createdAt), raw.createdAt as number, note.createdAt),
  };
  return { item, repaired };
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
