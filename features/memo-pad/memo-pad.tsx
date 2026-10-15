"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Eye, List, PencilLine, Save, Search, X } from "lucide-react";

import { CopyButton } from "@/components/copy-button";
import { DownloadButton } from "@/components/download-button";
import { Markdown } from "@/components/markdown";
import { SaveStatus, useSaveStatus } from "@/components/save-status";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadButton } from "@/components/upload-button";
import { searchTerms } from "@/lib/search";
import { useMounted } from "@/lib/use-mounted";
import { useSlashKey } from "@/lib/use-slash-key";
import { cn } from "@/lib/utils";

import { SavedMemoList } from "./components/saved-memo-list";
import { memoFile } from "./lib/download";
import {
  addSaved,
  afterLoad,
  filterLibrary,
  removeMemo,
  type MemoLibrary,
  type SavedMemo,
} from "./lib/library";
import {
  getLibraryServerSnapshot,
  getLibrarySnapshot,
  saveLibrary,
  subscribeLibrary,
} from "./lib/library-storage";
import { countChars, cursorPosition, lineCount } from "./lib/stats";
import {
  getMemoServerSnapshot,
  getMemoSnapshot,
  saveMemo,
  subscribeMemo,
  type MemoDoc,
  type MemoFormat,
} from "./lib/storage";

const FORMATS: MemoFormat[] = ["txt", "md"];
const NOTICE_MS = 3000;

export function MemoPad() {
  const doc = useSyncExternalStore(
    subscribeMemo,
    getMemoSnapshot,
    getMemoServerSnapshot
  );
  // 저장된 글이 화면에 들어오기 전에는 입력을 받지 않는다. 그 사이에 쓴 글이
  // 뒤늦게 나타난 저장된 글과 섞이기 때문이다.
  const loaded = useMounted();
  const [cursor, setCursor] = useState(0);
  // 좁은 화면에서 md일 때 편집과 프리뷰 중 무엇을 보는지. 넓은 화면은 둘 다 보인다.
  const [narrowView, setNarrowView] = useState<"edit" | "preview">("edit");
  // 확인을 기다리는, 파일에서 읽은 글.
  const [pendingImport, setPendingImport] = useState<MemoDoc | null>(null);
  const library = useSyncExternalStore(
    subscribeLibrary,
    getLibrarySnapshot,
    getLibraryServerSnapshot
  );
  // 저장 목록을 보는 중인지. 목록을 보는 동안에는 편집 자리 대신 목록이 나온다.
  const [listOpen, setListOpen] = useState(false);
  // 저장 목록의 검색 칸과 검색어. 목록을 떠나면 함께 지운다.
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  // 불러오기 확인을 기다리는 저장된 메모와, 지우기 확인을 기다리는 메모의 id.
  const [pendingLoad, setPendingLoad] = useState<SavedMemo | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const { saving, markSaved } = useSaveStatus();

  // 잠깐 알리고 사라지는 안내. 저장이 되었거나 저장할 글이 없을 때 쓴다.
  function showNotice(message: string) {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), NOTICE_MS);
  }

  useEffect(
    () => () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    },
    []
  );

  // 지금 글을 저장 목록에 한 장으로 남긴다. 쓰던 글은 그대로 둔다.
  function handleSave() {
    if (!doc.text.trim()) {
      showNotice("저장할 글이 없습니다");
      return;
    }
    saveLibrary(addSaved(library, doc, crypto.randomUUID(), Date.now()));
    showNotice("저장했습니다");
  }

  // Ctrl+S(맥은 Cmd+S)는 브라우저의 페이지 저장 대신 이 저장을 한다. 글 칸에 커서가 있어도 동작한다.
  // 키는 글자가 아닌 위치(code)로 본다. 한글 입력 상태에서도 같은 키가 잡히도록 하기 위해서다.
  const saveRef = useRef(handleSave);
  useEffect(() => {
    saveRef.current = handleSave;
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return;
      if (event.code !== "KeyS") return;
      event.preventDefault();
      saveRef.current();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // 저장한 메모를 편집 자리에 올린다. 지금 글이 있으면 임시 보관 칸에 먼저 넣는다.
  // 임시 보관본을 불러오는 경우에도 지금 글과 바꿔 담으므로 어느 쪽도 사라지지 않는다.
  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
  }

  function closeList() {
    setListOpen(false);
    closeSearch();
  }

  const terms = searchTerms(query);
  const shownLibrary = searchOpen ? filterLibrary(library, terms) : library;
  const hasSaved = library.saved.length > 0 || library.temp !== null;

  // "/"를 누르면 저장 목록의 검색 칸을 열고 그 칸에 커서를 둔다. 목록을 보는 동안에만 쓴다.
  function openSearch() {
    setSearchOpen(true);
    searchRef.current?.focus();
  }
  useSlashKey(listOpen && hasSaved, openSearch);

  function applyLoad(memo: SavedMemo, stashed: MemoLibrary) {
    saveLibrary(stashed);
    update({ text: memo.text, format: memo.format });
    closeList();
  }

  function handleLoad(memo: SavedMemo) {
    if (doc.text.trim()) setPendingLoad(memo);
    else applyLoad(memo, library);
  }

  const update = (next: MemoDoc) => {
    saveMemo(next);
    markSaved();
  };

  // 문서가 하나뿐이라 불러오면 쓰던 글이 바뀐다. 쓰던 글이 있으면 먼저 묻는다.
  const handleImport = (text: string, fileName: string) => {
    const next: MemoDoc = {
      text,
      format: fileName.toLowerCase().endsWith(".md") ? "md" : "txt",
    };
    if (doc.text.trim()) setPendingImport(next);
    else update(next);
  };

  const syncCursor = () => {
    setCursor(textareaRef.current?.selectionStart ?? 0);
  };

  const { line, column, position } = cursorPosition(doc.text, cursor);
  const chars = countChars(doc.text);
  const isMd = doc.format === "md";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
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
        <div className="flex flex-wrap items-center justify-end gap-1">
          <SaveStatus saving={saving} className="mr-1" />
          {isMd && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={narrowView === "edit" ? "프리뷰 보기" : "편집하기"}
              title={narrowView === "edit" ? "프리뷰 보기" : "편집하기"}
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
            className="text-muted-foreground"
            aria-label="메모 저장"
            title="메모 저장"
            onClick={handleSave}
          >
            <Save aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            aria-label={listOpen ? "편집으로 돌아가기" : "저장한 메모 목록"}
            aria-pressed={listOpen}
            title={listOpen ? "편집으로 돌아가기" : "저장한 메모 목록"}
            onClick={() => (listOpen ? closeList() : setListOpen(true))}
          >
            {listOpen ? <PencilLine aria-hidden="true" /> : <List aria-hidden="true" />}
          </Button>
          <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
          <CopyButton getText={() => doc.text} />
          <DownloadButton getFile={() => memoFile(doc.text, doc.format)} />
          <UploadButton
            accept=".txt,.md,text/plain,text/markdown"
            label="파일 불러오기"
            onText={handleImport}
          />
        </div>
      </div>

      {notice && (
        <p aria-live="polite" className="border-b px-4 py-1 text-center text-sm text-muted-foreground">
          {notice}
        </p>
      )}

      <AlertDialog
        open={pendingLoad !== null}
        onOpenChange={(open) => {
          if (!open) setPendingLoad(null);
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingLoad && pendingLoad.id === library.temp?.id
                ? "지금 글과 임시 보관본을 바꿀까요?"
                : "지금 글을 임시 보관하고 이 메모를 불러올까요?"}
            </AlertDialogTitle>
            {library.temp && pendingLoad?.id !== library.temp.id && (
              <AlertDialogDescription>이전 임시 보관본은 사라집니다.</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingLoad) {
                  applyLoad(pendingLoad, afterLoad(library, doc, crypto.randomUUID(), Date.now()));
                }
                setPendingLoad(null);
              }}
            >
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>이 메모를 지울까요?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) saveLibrary(removeMemo(library, pendingDelete));
                setPendingDelete(null);
              }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={pendingImport !== null}
        onOpenChange={(open) => {
          if (!open) setPendingImport(null);
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>쓰던 글을 불러온 파일로 바꿀까요?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingImport) update(pendingImport);
                setPendingImport(null);
              }}
            >
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {listOpen ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {hasSaved && (
            <div className="flex items-center gap-1 px-4 pt-4">
              {searchOpen ? (
                <>
                  <Input
                    ref={searchRef}
                    type="search"
                    aria-label="저장한 메모 검색"
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground"
                    aria-label="검색 닫기"
                    title="검색 닫기"
                    onClick={closeSearch}
                  >
                    <X aria-hidden="true" />
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-auto text-muted-foreground"
                  aria-label="저장한 메모 검색"
                  title="저장한 메모 검색"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search aria-hidden="true" />
                </Button>
              )}
            </div>
          )}
          <SavedMemoList
            library={shownLibrary}
            emptyMessage={searchOpen && terms.length > 0 ? "일치하는 메모가 없습니다" : undefined}
            onLoad={handleLoad}
            onDelete={(id) => setPendingDelete(id)}
          />
        </div>
      ) : (
      <div className={cn("grid min-h-0 flex-1", isMd && "md:grid-cols-2")}>
        <textarea
          ref={textareaRef}
          aria-label="메모 본문"
          value={doc.text}
          readOnly={!loaded}
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
              narrowView === "edit" && "hidden md:block"
            )}
          >
            <Markdown>{doc.text}</Markdown>
          </div>
        )}
      </div>
      )}

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
