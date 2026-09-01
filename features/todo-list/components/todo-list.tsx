"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Timer, Trash2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// ThemeToggle은 focus-timer에 위치하지만, 동일 레벨 피처 간 직접 임포트는
// 원칙상 피해야 한다. 추후 components/theme-toggle.tsx로 이전 예정.
import { ThemeToggle } from "@/features/focus-timer/components/theme-toggle";

import { loadItems, saveItems, type TodoItem } from "../lib/storage";

export function TodoList() {
  const [items, setItems] = useState<TodoItem[]>([]);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // 클라이언트 마운트 후에만 localStorage를 읽는다.
  useEffect(() => {
    setItems(loadItems());
  }, []);

  /** items를 업데이트하고 localStorage에 동기적으로 저장한다. */
  function updateItems(next: (prev: TodoItem[]) => TodoItem[]) {
    setItems((prev) => {
      const resolved = next(prev);
      saveItems(resolved);
      return resolved;
    });
  }

  function handleAdd() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const item: TodoItem = {
      id: crypto.randomUUID(),
      title: trimmed,
      completionCount: 0,
      createdAt: Date.now(),
    };
    updateItems((prev) => [item, ...prev]);
    setDraft("");
    inputRef.current?.focus();
  }

  function handleDelete(id: string) {
    updateItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* 헤더 */}
      <header className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="font-heading text-lg font-semibold tracking-tight">
          ritus
        </h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      {/* 본문 */}
      <main className="flex flex-1 flex-col items-center px-4 py-8">
        <div className="flex w-full max-w-md flex-col gap-6">
          {/* 입력 폼 */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAdd();
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              id="todo-input"
              placeholder="오늘 무엇을 할까요?"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="flex-1"
              aria-label="새 할 일"
            />
            <Button
              type="submit"
              size="icon"
              aria-label="할 일 추가"
              disabled={!draft.trim()}
            >
              <Plus aria-hidden="true" />
            </Button>
          </form>

          {/* 빈 상태 */}
          {items.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-20 text-center text-muted-foreground">
              <Timer
                className="h-10 w-10 opacity-20"
                aria-hidden="true"
              />
              <p className="text-sm">할 일을 추가하면 여기에 나타납니다</p>
            </div>
          )}

          {/* 할 일 목록 */}
          {items.length > 0 && (
            <ul className="flex flex-col gap-2" role="list">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="group flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className="flex-1 text-sm font-medium leading-snug">
                    {item.title}
                  </span>

                  {/* 완주 횟수 (1b 타이머 연결 후 실제로 쌓임) */}
                  {item.completionCount > 0 && (
                    <span
                      className="tabular-nums text-xs text-muted-foreground"
                      aria-label={`완주 ${item.completionCount}회`}
                    >
                      ×{item.completionCount}
                    </span>
                  )}

                  {/* 액션 버튼들 (호버 시 노출) */}
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    {/* 타이머 시작 (1b에서 todoId와 함께 연결 예정) */}
                    <Link
                      href={`/timer?todoId=${encodeURIComponent(item.id)}&title=${encodeURIComponent(item.title)}`}
                      className="inline-flex size-8 items-center justify-center rounded-2xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      aria-label={`"${item.title}" 타이머 시작`}
                    >
                      <Timer className="h-4 w-4" aria-hidden="true" />
                    </Link>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(item.id)}
                      aria-label={`"${item.title}" 삭제`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
