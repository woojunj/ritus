"use client";

import { useState, useRef, useSyncExternalStore } from "react";
import { Plus, Timer, Trash2, ChevronLeft, Check, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// ThemeToggle은 focus-timer에 위치하지만, 동일 레벨 피처 간 직접 임포트는
// 원칙상 피해야 한다. 추후 components/theme-toggle.tsx로 이전 예정.
import { ThemeToggle } from "@/features/focus-timer/components/theme-toggle";

import {
  saveItems,
  subscribeTodos,
  getTodosSnapshot,
  getTodosServerSnapshot,
  type TodoItem,
} from "../lib/storage";

export function TodoList() {
  const items = useSyncExternalStore(
    subscribeTodos,
    getTodosSnapshot,
    getTodosServerSnapshot
  );
  const [draft, setDraft] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleAdd() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const item: TodoItem = {
      id: crypto.randomUUID(),
      title: trimmed,
      completionCount: 0,
      createdAt: Date.now(),
    };
    saveItems([item, ...items]);
    setDraft("");
    inputRef.current?.focus();
  }

  function handleDelete(id: string) {
    saveItems(items.filter((item) => item.id !== id));
    if (confirmDeleteId === id) {
      setConfirmDeleteId(null);
    }
  }


  return (
    <div className="flex min-h-full flex-col">
      {/* 헤더 */}
      <header className="flex items-center justify-between border-b px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="타이머로 돌아가기"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
            ritus
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="타이머 화면으로 이동"
          >
            <Timer className="h-4 w-4" aria-hidden="true" />
          </Link>
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
              {items.map((item) => {
                const isConfirmingDelete = confirmDeleteId === item.id;
                const timerHref = `/?todoId=${encodeURIComponent(item.id)}&title=${encodeURIComponent(item.title)}`;

                return (
                  <li
                    key={item.id}
                    className="group flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
                  >
                    {/* 제목 영역: 모바일 터치 시 바로 타이머로 이동할 수 있도록 링크로 감쌈 */}
                    <Link
                      href={timerHref}
                      className="flex-1 min-w-0 py-0.5 text-sm font-medium leading-snug hover:underline focus-visible:outline-hidden"
                    >
                      <span className="block truncate">{item.title}</span>
                    </Link>

                    {/* 완주 횟수 */}
                    {item.completionCount > 0 && (
                      <span
                        className="tabular-nums text-xs text-muted-foreground shrink-0"
                        aria-label={`완주 ${item.completionCount}회`}
                      >
                        ×{item.completionCount}
                      </span>
                    )}

                    {/* 액션 컨트롤: 삭제 확인 중일 때와 평상시 */}
                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-1 shrink-0 animate-in fade-in duration-200">
                        <span className="text-xs text-destructive font-medium mr-1 hidden xs:inline">
                          삭제할까요?
                        </span>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => handleDelete(item.id)}
                          aria-label={`"${item.title}" 삭제 확인`}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                          삭제
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => setConfirmDeleteId(null)}
                          aria-label="삭제 취소"
                        >
                          <X className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                          취소
                        </Button>
                      </div>
                    ) : (
                      /* 평상시 액션 버튼: 모바일(터치)에서는 항상 보이고 데스크톱에서는 호버 시 강조 */
                      <div className="flex items-center gap-1 shrink-0 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                        {/* 타이머 시작 버튼 */}
                        <Link
                          href={timerHref}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          aria-label={`"${item.title}" 타이머 시작`}
                        >
                          <Timer className="h-4 w-4" aria-hidden="true" />
                        </Link>

                        {/* 삭제 버튼 (클릭 시 확인 단계로 진입하여 실수 삭제 방지) */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setConfirmDeleteId(item.id)}
                          aria-label={`"${item.title}" 삭제`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
