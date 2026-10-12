export type MemoFormat = "txt" | "md";

export type MemoDoc = {
  text: string;
  format: MemoFormat;
};

const STORAGE_KEY = "ritus:memo";
const EMPTY_DOC: MemoDoc = { text: "", format: "txt" };

let cachedRaw: string | null = null;
let cachedParsed: MemoDoc = EMPTY_DOC;
const listeners = new Set<() => void>();

export function subscribeMemo(callback: () => void): () => void {
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

export function getMemoSnapshot(): MemoDoc {
  if (typeof window === "undefined") return EMPTY_DOC;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? "";
    if (raw !== cachedRaw) {
      cachedParsed = raw
        ? { ...EMPTY_DOC, ...(JSON.parse(raw) as Partial<MemoDoc>) }
        : EMPTY_DOC;
      cachedRaw = raw;
    }
    return cachedParsed;
  } catch {
    return cachedParsed;
  }
}

// 서버와 hydration 첫 렌더는 늘 빈 문서로 그리고, 저장된 글은 그 뒤에 들어온다.
export function getMemoServerSnapshot(): MemoDoc {
  return EMPTY_DOC;
}

export function saveMemo(doc: MemoDoc): void {
  if (typeof window === "undefined") return;
  // 저장이 막혀도 쓰던 글은 화면에 남아야 하므로 캐시부터 바꾼다.
  cachedParsed = doc;
  try {
    const serialized = JSON.stringify(doc);
    localStorage.setItem(STORAGE_KEY, serialized);
    cachedRaw = serialized;
  } catch {
    // Ignore storage quota or disabled storage
  }
  for (const listener of listeners) {
    listener();
  }
}
