import type { RefObject } from "react";

import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/utils";

import { countChars, cursorPosition, lineCount } from "../lib/stats";
import type { MemoDoc } from "../lib/storage";

type EditorProps = {
  doc: MemoDoc;
  loaded: boolean;
  narrowView: "edit" | "preview";
  onChange: (doc: MemoDoc) => void;
  onCursorChange: (position: number) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
};

export function MemoEditor({
  doc, loaded, narrowView, onChange, onCursorChange, textareaRef,
}: EditorProps) {
  const isMd = doc.format === "md";

  function syncCursor() {
    onCursorChange(textareaRef.current?.selectionStart ?? 0);
  }

  return (
    <div data-memo-help="content" className={cn("grid min-h-0 flex-1", isMd && "md:grid-cols-2")}>
      <textarea
        ref={textareaRef}
        aria-label="메모 본문"
        value={doc.text}
        readOnly={!loaded}
        onChange={(event) => {
          onChange({ ...doc, text: event.target.value });
          onCursorChange(event.target.selectionStart);
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
            narrowView === "edit" && "hidden md:block"
          )}
        >
          <Markdown>{doc.text}</Markdown>
        </div>
      )}
    </div>
  );
}

export function MemoStatus({ doc, cursor }: { doc: MemoDoc; cursor: number }) {
  const { line, column, position } = cursorPosition(doc.text, cursor);
  const chars = countChars(doc.text);
  return (
    <p
      data-testid="memo-status"
      className="flex flex-wrap gap-x-2 border-t px-4 py-1.5 text-xs tabular-nums text-muted-foreground"
    >
      <span>Ln {line}, Col {column}, Pos {position}</span>
      <span aria-hidden="true">·</span>
      <span>{lineCount(doc.text)}줄</span>
      <span aria-hidden="true">·</span>
      <span>{chars.total}자 (공백 제외 {chars.withoutSpaces})</span>
    </p>
  );
}
