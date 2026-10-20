type BrowserStoreOptions<T> = {
  key: string;
  empty: T;
  parse: (raw: string) => T;
  readError: "empty" | "cached";
  writeMode: "persisted" | "memory";
};

/** 브라우저 저장소의 구독과 스냅샷 캐시. 데이터 형식과 실패 정책은 호출부가 정한다. */
export function createBrowserStore<T>({
  key,
  empty,
  parse,
  readError,
  writeMode,
}: BrowserStoreOptions<T>) {
  let cachedRaw: string | null = null;
  let cached: T = empty;
  const listeners = new Set<() => void>();

  function subscribe(callback: () => void): () => void {
    listeners.add(callback);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) {
        cachedRaw = null;
        callback();
      }
    };
    if (typeof window !== "undefined") window.addEventListener("storage", handleStorage);
    return () => {
      listeners.delete(callback);
      if (typeof window !== "undefined") window.removeEventListener("storage", handleStorage);
    };
  }

  function getSnapshot(): T {
    if (typeof window === "undefined") return empty;
    try {
      const raw = localStorage.getItem(key) ?? "";
      if (raw !== cachedRaw) {
        cached = parse(raw);
        cachedRaw = raw;
      }
      return cached;
    } catch {
      return readError === "cached" ? cached : empty;
    }
  }

  function getServerSnapshot(): T {
    return empty;
  }

  function save(value: T): void {
    if (typeof window === "undefined") return;
    // 메모는 저장이 막혀도 입력 중인 내용을 화면에 남긴다.
    if (writeMode === "memory") cached = value;
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      cachedRaw = serialized;
      cached = value;
    } catch {
      if (writeMode === "persisted") return;
    }
    for (const listener of listeners) listener();
  }

  return { subscribe, getSnapshot, getServerSnapshot, save };
}
