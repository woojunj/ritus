export type MemoFormat = "txt" | "md";

export type MemoDoc = {
  text: string;
  format: MemoFormat;
};

const STORAGE_KEY = "ritus:memo";
const EMPTY_DOC: MemoDoc = { text: "", format: "txt" };

export function loadMemo(): MemoDoc {
  if (typeof window === "undefined") return EMPTY_DOC;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY_DOC, ...(JSON.parse(raw) as Partial<MemoDoc>) } : EMPTY_DOC;
  } catch {
    return EMPTY_DOC;
  }
}

export function saveMemo(doc: MemoDoc): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
  } catch {
    // Ignore storage quota or disabled storage
  }
}
