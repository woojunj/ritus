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
  const [isEditing, setIsEditing] = useState(false);
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
    const nextItems = items.filter((item) => item.id !== id);
    saveItems(nextItems);
    if (confirmDeleteId === id) {
      setConfirmDeleteId(null);
    }
    if (nextItems.length === 0) {
      setIsEditing(false);
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

          {/* 할 일 목록 영역 */}
          {items.length > 0 && (
            <div className="flex flex-col gap-2">
              {/* 목록 상단 정보 및 편집 토글 */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-medium text-muted-foreground">
                  할 일 {items.length}개
                </span>
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <span className="text-xs text-muted-foreground/60 hidden sm:inline">
                      카드를 터치하면 타이머 시작
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setIsEditing((prev) => !prev);
                      setConfirmDeleteId(null);
                    }}
                    aria-label={isEditing ? "편집 완료" : "할 일 편집"}
                  >
                    {isEditing ? "완료" : "편집"}
                  </Button>
                </div>
              </div>

              {/* 할 일 목록 */}
              <ul className="flex flex-col gap-2" role="list">
                {items.map((item) => {
                  const isConfirmingDelete = confirmDeleteId === item.id;
                  const timerHref = `/?todoId=${encodeURIComponent(item.id)}&title=${encodeURIComponent(item.title)}`;

                  return (
                    <li
                      key={item.id}
                      className="flex items-stretch rounded-xl border bg-card shadow-xs transition-shadow hover:shadow-md overflow-hidden"
                    >
                      {/* 카드 메인 영역: 타이머 시작을 위한 넓은 탭 영역 (터치 친화적) */}
                      <Link
                        href={timerHref}
                        className="group flex flex-1 items-center gap-3 px-4 py-3.5 hover:bg-accent/40 active:bg-accent/60 transition-colors min-w-0"
                        aria-label={`"${item.title}" 타이머 시작`}
                      >
                        <Timer
                          className="h-4 w-4 text-muted-foreground/70 shrink-0 group-hover:text-foreground transition-colors"
                          aria-hidden="true"
                        />
                        <span className="flex-1 min-w-0 truncate text-sm font-medium leading-snug">
                          {item.title}
                        </span>
                        {item.completionCount > 0 && (
                          <span
                            className="tabular-nums text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0"
                            aria-label={`완주 ${item.completionCount}회`}
                          >
                            ×{item.completionCount}
                          </span>
                        )}
                      </Link>

                      {/* 우측 영역: 편집 모드일 때만 노출되는 삭제 제어 (실수 터치 방지) */}
                      {isEditing && (
                        <div className="flex items-center border-l bg-card px-2 shrink-0 animate-in fade-in duration-150">
                          {isConfirmingDelete ? (
                            <div className="flex items-center gap-1 animate-in fade-in duration-150">
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-9 rounded-lg text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                              onClick={() => setConfirmDeleteId(item.id)}
                              aria-label={`"${item.title}" 삭제`}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

