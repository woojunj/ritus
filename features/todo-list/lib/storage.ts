export type TodoItem = {
  id: string;
  title: string;
  /** 타이머 완주로 쌓인 횟수 */
  completionCount: number;
  createdAt: number;
};

const STORAGE_KEY = "ritus:todos";

let cachedRaw: string | null = null;
let cachedParsed: TodoItem[] = [];
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeTodos(callback: () => void): () => void {
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
const EMPTY: TodoItem[] = [];

export function getTodosSnapshot(): TodoItem[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? "";
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedParsed = raw ? (JSON.parse(raw) as TodoItem[]) : [];
    }
    return cachedParsed;
  } catch {
    return EMPTY;
  }
}

export function getTodosServerSnapshot(): TodoItem[] {
  return EMPTY;
}

export function loadItems(): TodoItem[] {
  return getTodosSnapshot();
}

export function saveItems(items: TodoItem[]): void {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(items);
    localStorage.setItem(STORAGE_KEY, serialized);
    cachedRaw = serialized;
    cachedParsed = items;
    notify();
  } catch {
    // Ignore storage quota or disabled storage
  }
}

export function incrementCompletionCount(id: string): void {
  const current = loadItems();
  const next = current.map((item) =>
    item.id === id ? { ...item, completionCount: item.completionCount + 1 } : item
  );
  saveItems(next);
}

