import { EMPTY_LIBRARY, normalizeLibrary, type MemoLibrary } from "./library";

const STORAGE_KEY = "ritus:memo-library";

let cachedRaw: string | null = null;
let cachedParsed: MemoLibrary = EMPTY_LIBRARY;
const listeners = new Set<() => void>();

export function subscribeLibrary(callback: () => void): () => void {
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

export function getLibrarySnapshot(): MemoLibrary {
  if (typeof window === "undefined") return EMPTY_LIBRARY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? "";
    if (raw !== cachedRaw) {
      cachedParsed = raw ? normalizeLibrary(JSON.parse(raw)) : EMPTY_LIBRARY;
      cachedRaw = raw;
    }
    return cachedParsed;
  } catch {
    return cachedParsed;
  }
}

// 서버와 hydration 첫 렌더는 빈 목록으로 그리고, 저장된 목록은 그 뒤에 들어온다.
export function getLibraryServerSnapshot(): MemoLibrary {
  return EMPTY_LIBRARY;
}

export function saveLibrary(library: MemoLibrary): void {
  if (typeof window === "undefined") return;
  cachedParsed = library;
  try {
    const serialized = JSON.stringify(library);
    localStorage.setItem(STORAGE_KEY, serialized);
    cachedRaw = serialized;
  } catch {
    // 저장이 막혀도 화면의 목록은 바뀌어야 하므로 캐시는 유지한다.
  }
  for (const listener of listeners) {
    listener();
  }
}
