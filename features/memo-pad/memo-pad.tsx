"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Download, Eye, PencilLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { downloadMemo } from "./lib/download";
import { countChars, cursorPosition, lineCount } from "./lib/stats";
import { loadMemo, saveMemo, type MemoDoc, type MemoFormat } from "./lib/storage";

const FORMATS: MemoFormat[] = ["txt", "md"];

// 프리뷰 안의 마크다운 요소 스타일. typography 플러그인 없이 필요한 만큼만 둔다.
const PREVIEW_CLASS = cn(
  "space-y-3 text-sm leading-relaxed",
  "[&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold",
  "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5",
  "[&_a]:text-primary [&_a]:underline",
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:font-mono",
  "[&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_pre_code]:p-0",
  "[&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground"
);

export function MemoPad() {
  const [doc, setDoc] = useState<MemoDoc>(loadMemo);
  const [cursor, setCursor] = useState(0);
  // 좁은 화면에서 md일 때 편집과 프리뷰 중 무엇을 보는지. 넓은 화면은 둘 다 보인다.
  const [narrowView, setNarrowView] = useState<"edit" | "preview">("edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const update = (next: MemoDoc) => {
    setDoc(next);
    saveMemo(next);
  };

  const syncCursor = () => {
    setCursor(textareaRef.current?.selectionStart ?? 0);
  };

  const { line, column, position } = cursorPosition(doc.text, cursor);
  const chars = countChars(doc.text);
  const isMd = doc.format === "md";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div role="tablist" aria-label="형식" className="flex gap-1">
          {FORMATS.map((format) => (
            <Button
              key={format}
              type="button"
              role="tab"
              size="sm"
              variant={doc.format === format ? "secondary" : "ghost"}
              aria-selected={doc.format === format}
              onClick={() => update({ ...doc, format })}
            >
              {format}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {isMd && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={narrowView === "edit" ? "프리뷰 보기" : "편집하기"}
              onClick={() =>
                setNarrowView((view) => (view === "edit" ? "preview" : "edit"))
              }
            >
              {narrowView === "edit" ? (
                <Eye aria-hidden="true" />
              ) : (
                <PencilLine aria-hidden="true" />
              )}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="파일로 저장"
            onClick={() => downloadMemo(doc.text, doc.format)}
          >
            <Download aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className={cn("grid min-h-0 flex-1", isMd && "md:grid-cols-2")}>
        <textarea
          ref={textareaRef}
          aria-label="메모 본문"
          value={doc.text}
          onChange={(e) => {
            update({ ...doc, text: e.target.value });
            setCursor(e.target.selectionStart);
          }}
          onSelect={syncCursor}
          onKeyUp={syncCursor}
          onClick={syncCursor}
          spellCheck={false}
          className={cn(
            "min-h-0 w-full resize-none bg-transparent p-4 font-mono text-sm leading-relaxed outline-none",
            isMd && narrowView === "preview" && "hidden md:block"
          )}
        />
        {isMd && (
          <div
            data-testid="memo-preview"
            className={cn(
              "min-h-0 overflow-y-auto border-t p-4 md:border-t-0 md:border-l",
              PREVIEW_CLASS,
              narrowView === "edit" && "hidden md:block"
            )}
          >
            <ReactMarkdown>{doc.text}</ReactMarkdown>
          </div>
        )}
      </div>

      <p
        data-testid="memo-status"
        className="flex flex-wrap gap-x-2 border-t px-4 py-1.5 text-xs tabular-nums text-muted-foreground"
      >
        <span>
          Ln {line}, Col {column}, Pos {position}
        </span>
        <span aria-hidden="true">·</span>
        <span>{lineCount(doc.text)}줄</span>
        <span aria-hidden="true">·</span>
        <span>
          {chars.total}자 (공백 제외 {chars.withoutSpaces})
        </span>
      </p>
    </div>
  );
}
