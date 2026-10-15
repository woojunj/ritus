import type { MemoDoc, MemoFormat } from "./storage";

/** 저장 목록에 한 장으로 남긴 메모. */
export type SavedMemo = {
  id: string;
  text: string;
  format: MemoFormat;
  /** 저장한 시각(ms) */
  savedAt: number;
};

/** 저장한 메모들과 임시 보관 칸. 임시 보관은 한 칸이다. */
export type MemoLibrary = {
  saved: SavedMemo[];
  temp: SavedMemo | null;
};

export const EMPTY_LIBRARY: MemoLibrary = { saved: [], temp: null };

/** 지금 글을 저장 목록 맨 위에 한 장으로 더한다. */
export function addSaved(library: MemoLibrary, doc: MemoDoc, id: string, now: number): MemoLibrary {
  return {
    ...library,
    saved: [{ id, text: doc.text, format: doc.format, savedAt: now }, ...library.saved],
  };
}

/** 지금 글을 임시 보관 칸에 넣는다. 이전 임시 보관본은 덮어쓴다. */
export function stashTemp(library: MemoLibrary, doc: MemoDoc, id: string, now: number): MemoLibrary {
  return { ...library, temp: { id, text: doc.text, format: doc.format, savedAt: now } };
}

/** 한 장을 지운다. 임시 보관본이면 임시 보관 칸을 비운다. */
export function removeMemo(library: MemoLibrary, id: string): MemoLibrary {
  return {
    saved: library.saved.filter((memo) => memo.id !== id),
    temp: library.temp?.id === id ? null : library.temp,
  };
}

/** 목록에 보일 제목. 글의 첫 줄을 쓴다. */
export function memoTitle(text: string): string {
  return text.split("\n").find((line) => line.trim())?.trim() ?? "";
}

function normalizeMemo(value: unknown): SavedMemo | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.id !== "string" || !raw.id || typeof raw.text !== "string") return null;
  return {
    id: raw.id,
    text: raw.text,
    format: raw.format === "md" ? "md" : "txt",
    savedAt: Number.isFinite(raw.savedAt) ? (raw.savedAt as number) : 0,
  };
}

/**
 * 백업 파일이나 저장소에서 읽은 값을 저장 목록으로 바로잡는다.
 * 예전 백업에는 이 항목이 없으므로 빈 목록으로 읽는다. 모양이 틀린 한 장은 건너뛴다.
 */
export function normalizeLibrary(value: unknown): MemoLibrary {
  if (typeof value !== "object" || value === null) return EMPTY_LIBRARY;
  const raw = value as Record<string, unknown>;
  const saved = Array.isArray(raw.saved)
    ? raw.saved.map(normalizeMemo).filter((memo): memo is SavedMemo => memo !== null)
    : [];
  return { saved, temp: normalizeMemo(raw.temp) };
}

/**
 * 저장한 메모를 불러올 때의 저장 목록. 지금 글이 있으면 임시 보관 칸에 넣고,
 * 없으면 목록은 그대로 둔다.
 */
export function afterLoad(library: MemoLibrary, current: MemoDoc, id: string, now: number): MemoLibrary {
  return current.text.trim() ? stashTemp(library, current, id, now) : library;
}
