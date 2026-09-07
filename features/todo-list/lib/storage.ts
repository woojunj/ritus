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

export function getTodosSnapshot(): TodoItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? "";
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedParsed = raw ? (JSON.parse(raw) as TodoItem[]) : [];
    }
    return cachedParsed;
  } catch {
    return [];
  }
}

const SERVER_EMPTY: TodoItem[] = [];
export function getTodosServerSnapshot(): TodoItem[] {
  return SERVER_EMPTY;
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

