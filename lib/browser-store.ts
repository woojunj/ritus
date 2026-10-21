type BrowserStoreOptions<T> = {
  key: string;
  empty: T;
  parse: (raw: string) => T;
  readError: "empty" | "cached";
};

// 실패한 값은 해당 저장 장치의 캐시에 두고, 화면을 옮겨도 복구할 수 있게 한다.
const failedSaves = new Map<string, () => boolean>();
const failureListeners = new Set<() => void>();

export function subscribeSaveFailures(callback: () => void): () => void {
  failureListeners.add(callback);
  return () => { failureListeners.delete(callback); };
}

export function getSaveFailureSnapshot(): boolean {
  return failedSaves.size > 0;
}

export function getSaveFailureServerSnapshot(): boolean {
  return false;
}

export function retryFailedSaves(): void {
  for (const retry of [...failedSaves.values()]) retry();
}

/** 브라우저 저장소의 구독과 스냅샷 캐시. 데이터 형식과 읽기 실패 정책은 호출부가 정한다. */
export function createBrowserStore<T>({
  key,
  empty,
  parse,
  readError,
}: BrowserStoreOptions<T>) {
  let cachedRaw: string | null = null;
  let cached: T = empty;
  let pendingSave = false;
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
    // 저장에 실패한 최신 글을 디스크의 이전 값으로 덮어쓰지 않는다.
    if (pendingSave) return cached;
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

  function save(value: T): boolean {
    if (typeof window === "undefined") return false;
    cached = value;
    let succeeded = false;
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      cachedRaw = serialized;
      pendingSave = false;
      failedSaves.delete(key);
      succeeded = true;
    } catch {
      pendingSave = true;
      failedSaves.set(key, () => save(cached));
    }
    for (const listener of failureListeners) listener();
    for (const listener of listeners) listener();
    return succeeded;
  }

  return { subscribe, getSnapshot, getServerSnapshot, save };
}
