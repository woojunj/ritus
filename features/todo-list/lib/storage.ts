import { createBrowserStore } from "@/lib/browser-store";

export type TodoItem = {
  id: string;
  title: string;
  /** 타이머 완주로 쌓인 횟수 */
  completionCount: number;
  createdAt: number;
};

const store = createBrowserStore<TodoItem[]>({
  key: "ritus:todos",
  empty: [],
  parse: (raw) => raw ? JSON.parse(raw) as TodoItem[] : [],
  readError: "empty",
  writeMode: "persisted",
});

export const subscribeTodos = store.subscribe;
export const getTodosSnapshot = store.getSnapshot;
export const getTodosServerSnapshot = store.getServerSnapshot;
export const loadItems = store.getSnapshot;
export const saveItems = store.save;

export function incrementCompletionCount(id: string): void {
  const current = loadItems();
  const next = current.map((item) =>
    item.id === id ? { ...item, completionCount: item.completionCount + 1 } : item
  );
  saveItems(next);
}

/**
 * 밖에서 들어온 값(백업 파일 등)을 할 일로 바로잡는다. 제목이 없으면 null.
 * 모양이 맞지 않는 칸은 기본값으로 바꿔 화면이 깨지지 않게 하고, 바꾼 칸이 있으면 repaired다.
 */
export function normalizeTodo(value: unknown): { item: TodoItem; repaired: boolean } | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.title !== "string" || !raw.title.trim()) return null;
  const idOk = typeof raw.id === "string" && raw.id !== "";
  const count = raw.completionCount;
  const countOk = Number.isInteger(count) && (count as number) >= 0;
  const createdOk = Number.isFinite(raw.createdAt);
  return {
    item: {
      id: idOk ? (raw.id as string) : crypto.randomUUID(),
      title: raw.title,
      completionCount: countOk ? (count as number) : 0,
      createdAt: createdOk ? (raw.createdAt as number) : Date.now(),
    },
    repaired: !idOk || !countOk || !createdOk,
  };
}
