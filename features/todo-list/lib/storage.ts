export type TodoItem = {
  id: string;
  title: string;
  /** 타이머 완주로 쌓인 횟수 */
  completionCount: number;
  createdAt: number;
};

const STORAGE_KEY = "ritus:todos";

export function loadItems(): TodoItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TodoItem[];
  } catch {
    return [];
  }
}

export function saveItems(items: TodoItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
