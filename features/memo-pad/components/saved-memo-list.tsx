"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { memoTitle, type MemoLibrary, type SavedMemo } from "../lib/library";

const DATE_FORMAT = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
});

// 저장한 메모를 양심노트 목록처럼 카드로 보여 준다. 임시 보관본은 맨 위에 둔다.
export function SavedMemoList({
  library,
  onLoad,
  onDelete,
  emptyMessage = "저장한 메모가 여기에 나타납니다",
}: {
  library: MemoLibrary;
  onLoad: (memo: SavedMemo) => void;
  onDelete: (id: string) => void;
  emptyMessage?: string;
}) {
  const items = library.temp ? [library.temp, ...library.saved] : library.saved;

  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">{emptyMessage}</p>
    );
  }

  return (
    <ul className="flex flex-col gap-2 p-4" role="list">
      {items.map((memo) => {
        const isTemp = memo.id === library.temp?.id;
        const title = memoTitle(memo.text) || "(내용 없음)";
        return (
          <li
            key={memo.id}
            className={cn(
              "flex items-stretch overflow-hidden rounded-xl border bg-card shadow-xs",
              isTemp && "border-dashed"
            )}
          >
            <button
              type="button"
              onClick={() => onLoad(memo)}
              aria-label={`"${title}" 불러오기`}
              title={`"${title}" 불러오기`}
              className="flex min-w-0 flex-1 flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-accent/40 active:bg-accent/60"
            >
              <span className="text-xs tabular-nums text-muted-foreground">
                {isTemp ? "임시 보관" : DATE_FORMAT.format(new Date(memo.savedAt))}
              </span>
              <span className="truncate text-sm font-medium leading-snug">{title}</span>
            </button>
            <div className="flex shrink-0 items-center pr-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onDelete(memo.id)}
                aria-label={`"${title}" 삭제`}
                title={`"${title}" 삭제`}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
