"use client";

import { useEffect, useState, useRef, useSyncExternalStore } from "react";
import { Plus, Search, Timer, Trash2, Check, X } from "lucide-react";
import Link from "next/link";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { DownloadButton } from "@/components/download-button";
import { Input } from "@/components/ui/input";
import { UploadButton } from "@/components/upload-button";
import { containsAllTerms, searchTerms } from "@/lib/search";
import { useKeyShortcut } from "@/lib/use-key-shortcut";
import { cn } from "@/lib/utils";

import { parseTodos, todosFile, todosToCsv } from "../lib/csv";
import { TodoHelp } from "./todo-help";
import {
  saveItems,
  subscribeTodos,
  getTodosSnapshot,
  getTodosServerSnapshot,
  type TodoItem,
} from "../lib/storage";

interface TodoListProps {
  /** 할 일 카드를 눌러 그 할 일로 타이머를 시작하려 할 때 호출된다. */
  onStartTimer: (item: TodoItem) => void;
  /** true를 돌려주면 onStartTimer를 부르기 전에 지금 세션을 그만둘지 확인한다. */
  shouldConfirmStart?: (item: TodoItem) => boolean;
}

export function TodoList({
  onStartTimer,
  shouldConfirmStart,
}: TodoListProps) {
  const items = useSyncExternalStore(
    subscribeTodos,
    getTodosSnapshot,
    getTodosServerSnapshot
  );
  const [draft, setDraft] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pendingStart, setPendingStart] = useState<TodoItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  function handleAdd() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const item: TodoItem = {
      id: crypto.randomUUID(),
      title: trimmed,
      completionCount: 0,
      completed: false,
      createdAt: Date.now(),
    };
    saveItems([item, ...items]);
    setDraft("");
    inputRef.current?.focus();
  }

  // 내려받은 CSV의 할 일을 목록 뒤에 더한다. 이미 같은 제목이 있으면 건너뛴다.
  function handleImport(text: string) {
    const added = parseTodos(text, items);
    if (added.length > 0) saveItems([...items, ...added]);
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

  function toggleCompleted(id: string) {
    saveItems(items.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  }

  // 검색은 목록에서만 쓴다. 할 일 카드를 눌러 세션을 시작하면 검색 칸과 검색어를 지운다.
  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
  }

  // "/"를 누르면 검색 칸을 열고 그 칸에 커서를 둔다. 이미 열려 있으면 칸으로 옮긴다.
  function openSearch() {
    setSearchOpen(true);
    searchRef.current?.focus();
  }
  useKeyShortcut("/", true, openSearch);

  const terms = searchTerms(query);
  const visibleItems = searchOpen
    ? items.filter((item) => containsAllTerms(item.title, terms))
    : items;

  // 카드를 누를 때와 같은 시작 흐름. 세션이 도는 중이면 먼저 확인을 받는다.
  function startItem(item: TodoItem) {
    if (item.completed) return;
    if (shouldConfirmStart?.(item)) {
      setPendingStart(item);
    } else {
      closeSearch();
      onStartTimer(item);
    }
  }

  // 방향키로 고른 카드의 자리. 목록이 줄어 범위를 넘으면 보이지 않는 것으로 본다.
  const [highlight, setHighlight] = useState<number | null>(null);
  const highlighted =
    highlight !== null && highlight < visibleItems.length && !visibleItems[highlight].completed ? highlight : null;
  const activeIndexes = visibleItems.flatMap((item, index) => item.completed ? [] : [index]);
  const keyboardOn = !isEditing && pendingStart === null && activeIndexes.length > 0;

  useKeyShortcut("ArrowDown", keyboardOn, () => {
    setHighlight(current => activeIndexes.find(index => index > (current ?? -1)) ?? activeIndexes[activeIndexes.length - 1]);
  }, { onlyWhenNothingFocused: true });
  useKeyShortcut("ArrowUp", keyboardOn, () => {
    setHighlight(current => activeIndexes.findLast(index => index < (current ?? 0)) ?? activeIndexes[0]);
  }, { onlyWhenNothingFocused: true });
  useKeyShortcut(" ", keyboardOn, () => {
    if (highlighted !== null) startItem(visibleItems[highlighted]);
  }, { onlyWhenNothingFocused: true });

  useEffect(() => {
    if (highlighted === null) return;
    document
      .querySelector<HTMLElement>('[data-highlighted="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  return (
    <div data-help-root className="flex min-h-full flex-col">
      {/* 본문 */}
      <div className="flex flex-1 flex-col items-center px-4 py-8">
        <div className="flex w-full max-w-md flex-col gap-6">
          {/* 입력 폼 */}
          <form
            data-todo-help="add"
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
              title="할 일 추가"
              disabled={!draft.trim()}
            >
              <Plus aria-hidden="true" />
            </Button>
            <TodoHelp key={`${items.length > 0}-${visibleItems.length > 0}`} hasItems={items.length > 0} hasVisibleItems={visibleItems.length > 0} />
          </form>

          {/* 빈 상태 */}
          {items.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-20 text-center text-muted-foreground">
              <Timer
                className="h-10 w-10 opacity-20"
                aria-hidden="true"
              />
              <p className="text-sm">할 일을 추가하면 여기에 나타납니다</p>
              {/* 목록이 비어 있을 때도 내려받아 둔 파일로 시작할 수 있게 한다. */}
              <span data-todo-help="import" className="inline-flex"><UploadButton
                accept=".csv,text/csv"
                label="할 일 불러오기"
                onText={handleImport}
              /></span>
            </div>
          )}

          {/* 할 일 목록 영역 */}
          {items.length > 0 && (
            <div className="flex flex-col gap-2">
              {/* 목록 상단 정보 및 편집 토글 */}
              <div className="flex items-center justify-between px-1">
                <div data-todo-help="search" className="flex items-center gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    할 일 {items.length}개
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-foreground"
                    title="할 일 검색"
                    aria-expanded={searchOpen}
                    onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
                  >
                    <Search aria-hidden="true" />
                    <span className="sr-only">할 일 검색</span>
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <span className="text-xs text-muted-foreground/60 hidden sm:inline">
                      카드를 누르면 타이머 설정
                    </span>
                  )}
                  <span data-todo-help="copy" className="inline-flex"><CopyButton
                    getText={() => todosToCsv(items)}
                    className="size-7 text-muted-foreground hover:text-foreground"
                  /></span>
                  <span data-todo-help="download" className="inline-flex"><DownloadButton
                    getFile={() => todosFile(items)}
                    className="size-7 text-muted-foreground hover:text-foreground"
                  /></span>
                  <span data-todo-help="import" className="inline-flex"><UploadButton
                    accept=".csv,text/csv"
                    label="할 일 불러오기"
                    onText={handleImport}
                    className="size-7 text-muted-foreground hover:text-foreground"
                  /></span>
                  <Button
                    data-todo-help="edit"
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

              {searchOpen && (
                <div className="flex items-center gap-1">
                  <Input
                    ref={searchRef}
                    type="search"
                    aria-label="할 일 검색"
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground"
                    title="검색 닫기"
                    aria-label="검색 닫기"
                    onClick={closeSearch}
                  >
                    <X aria-hidden="true" />
                  </Button>
                </div>
              )}

              {visibleItems.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  일치하는 할 일이 없습니다
                </p>
              ) : (
              /* 할 일 목록 */
              <ul className="flex flex-col gap-2" role="list">
                {visibleItems.map((item, index) => {
                  const isConfirmingDelete = confirmDeleteId === item.id;
                  const isHighlighted = highlighted === index;

                  return (
                    <li
                      key={item.id}
                      data-highlighted={isHighlighted}
                      className={`flex items-stretch rounded-xl border bg-card shadow-xs transition-shadow hover:shadow-md overflow-hidden${isHighlighted ? " ring-2 ring-ring" : ""}`}
                    >
                      <label data-todo-help={index === 0 ? "check" : undefined} className="flex w-11 shrink-0 cursor-pointer items-center justify-center" title={item.completed ? "체크 해제해 다시 활성화" : "완료로 체크"}>
                        <input
                          type="checkbox"
                          aria-label={`"${item.title}" 완료`}
                          checked={!!item.completed}
                          onChange={() => toggleCompleted(item.id)}
                          className="size-4 cursor-pointer accent-primary"
                        />
                      </label>
                      {/* 체크한 항목은 남겨 두되 타이머 진입만 막는다. */}
                      <Link
                        data-todo-help={index === 0 ? "card" : undefined}
                        href="/"
                        onClick={(e) => {
                          e.preventDefault();
                          startItem(item);
                        }}
                        aria-disabled={!!item.completed}
                        tabIndex={item.completed ? -1 : 0}
                        className={cn("group flex min-w-0 flex-1 items-center gap-3 px-3 py-3.5 transition-colors", item.completed ? "cursor-default text-muted-foreground" : "hover:bg-accent/40 active:bg-accent/60")}
                        aria-label={`"${item.title}" 타이머 시작`}
                        title={`"${item.title}" 타이머 시작`}
                      >
                        <Timer
                          className="h-4 w-4 text-muted-foreground/70 shrink-0 group-hover:text-foreground transition-colors"
                          aria-hidden="true"
                        />
                        <span className={cn("min-w-0 flex-1 truncate text-sm font-medium leading-snug", item.completed && "line-through opacity-60")}>
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
                              title={`"${item.title}" 삭제`}
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
              )}
            </div>
          )}
        </div>
      </div>

      <AlertDialog
        open={pendingStart !== null}
        onOpenChange={(open) => {
          if (!open) setPendingStart(null);
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              지금 세션을 그만두고 새로 시작할까요?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingStart) {
                  closeSearch();
                  onStartTimer(pendingStart);
                }
                setPendingStart(null);
              }}
            >
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

