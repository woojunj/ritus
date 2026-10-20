"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { useSaveStatus } from "@/components/save-status";
import { useMounted } from "@/lib/use-mounted";

import { MemoDialogs } from "./components/memo-dialogs";
import { MemoEditor, MemoStatus } from "./components/memo-editor";
import { MemoLibraryView } from "./components/memo-library-view";
import { MemoToolbar } from "./components/memo-toolbar";
import { addSaved, afterLoad, removeMemo, type MemoLibrary, type SavedMemo } from "./lib/library";
import {
  getLibraryServerSnapshot, getLibrarySnapshot, saveLibrary, subscribeLibrary,
} from "./lib/library-storage";
import {
  getMemoServerSnapshot, getMemoSnapshot, saveMemo, subscribeMemo, type MemoDoc,
} from "./lib/storage";

const NOTICE_MS = 3000;

// 저장과 확인이 필요한 동작을 조합하고 화면 표시는 내부 컴포넌트에 맡긴다.
export function MemoPad() {
  const doc = useSyncExternalStore(subscribeMemo, getMemoSnapshot, getMemoServerSnapshot);
  const library = useSyncExternalStore(subscribeLibrary, getLibrarySnapshot, getLibraryServerSnapshot);
  // 저장된 글이 hydration으로 들어오기 전의 입력은 막는다.
  const loaded = useMounted();
  const [cursor, setCursor] = useState(0);
  const [narrowView, setNarrowView] = useState<"edit" | "preview">("edit");
  const [listOpen, setListOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<MemoDoc | null>(null);
  const [pendingLoad, setPendingLoad] = useState<SavedMemo | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { saving, markSaved } = useSaveStatus();

  useEffect(() => {
    textareaRef.current?.focus();
    return () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, []);

  function update(next: MemoDoc) {
    saveMemo(next);
    markSaved();
  }

  function showNotice(message: string) {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), NOTICE_MS);
  }

  function handleSave() {
    if (!doc.text.trim()) {
      showNotice("저장할 글이 없습니다");
      return;
    }
    saveLibrary(addSaved(library, doc, crypto.randomUUID(), Date.now()));
    showNotice("저장했습니다");
  }

  // 입력 중에도 저장한다. 한글 입력 상태와 무관하게 키 위치를 본다.
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

  function applyLoad(memo: SavedMemo, stashed: MemoLibrary) {
    saveLibrary(stashed);
    update({ text: memo.text, format: memo.format });
    setListOpen(false);
  }

  function handleLoad(memo: SavedMemo) {
    if (doc.text.trim()) setPendingLoad(memo);
    else applyLoad(memo, library);
  }

  function handleImport(text: string, fileName: string) {
    const next: MemoDoc = { text, format: fileName.toLowerCase().endsWith(".md") ? "md" : "txt" };
    if (doc.text.trim()) setPendingImport(next);
    else update(next);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MemoToolbar
        doc={doc}
        saving={saving}
        listOpen={listOpen}
        narrowView={narrowView}
        onChange={update}
        onTogglePreview={() => setNarrowView((view) => view === "edit" ? "preview" : "edit")}
        onToggleList={() => setListOpen((open) => !open)}
        onSave={handleSave}
        onImport={handleImport}
      />
      {notice && (
        <p aria-live="polite" className="border-b px-4 py-1 text-center text-sm text-muted-foreground">
          {notice}
        </p>
      )}
      <MemoDialogs
        pendingLoad={pendingLoad}
        pendingDelete={pendingDelete}
        pendingImport={pendingImport}
        temp={library.temp}
        onCancelLoad={() => setPendingLoad(null)}
        onCancelDelete={() => setPendingDelete(null)}
        onCancelImport={() => setPendingImport(null)}
        onLoad={() => {
          if (pendingLoad) applyLoad(pendingLoad, afterLoad(library, doc, crypto.randomUUID(), Date.now()));
          setPendingLoad(null);
        }}
        onDelete={() => {
          if (pendingDelete) saveLibrary(removeMemo(library, pendingDelete));
          setPendingDelete(null);
        }}
        onImport={() => {
          if (pendingImport) update(pendingImport);
          setPendingImport(null);
        }}
      />
      {listOpen ? (
        <MemoLibraryView library={library} onLoad={handleLoad} onDelete={setPendingDelete} />
      ) : (
        <MemoEditor
          doc={doc} loaded={loaded} narrowView={narrowView}
          onChange={update} onCursorChange={setCursor} textareaRef={textareaRef}
        />
      )}
      <MemoStatus doc={doc} cursor={cursor} />
    </div>
  );
}
