import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Maximize2, Minimize2, Pencil, RotateCcw } from "lucide-react";

import { SaveStatus, useSaveStatus } from "@/components/save-status";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMounted } from "@/lib/use-mounted";

import {
  DEFAULT_SOURCE, SOURCE_TITLE, SOURCE_URL, getTranscriptionServerSnapshot,
  getTranscriptionSnapshot, saveTranscription, subscribeTranscription,
  type TranscriptionDoc,
} from "../lib/transcription-storage";
import { MemoStatus } from "./memo-editor";
import styles from "./transcription.module.css";

export function Transcription() {
  const doc = useSyncExternalStore(subscribeTranscription, getTranscriptionSnapshot, getTranscriptionServerSnapshot);
  const loaded = useMounted();
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const { saving, markSaved } = useSaveStatus();

  useEffect(() => {
    if (!expanded) return;
    const viewport = window.visualViewport;
    const container = containerRef.current;
    function resize() {
      container?.style.setProperty("--visible-height", `${viewport?.height ?? window.innerHeight}px`);
      container?.style.setProperty("--visible-top", `${viewport?.offsetTop ?? 0}px`);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (document.activeElement instanceof HTMLElement && container?.contains(document.activeElement)) {
        document.activeElement.blur();
      }
      setExpanded(false);
    }
    resize();
    viewport?.addEventListener("resize", resize);
    viewport?.addEventListener("scroll", resize);
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      viewport?.removeEventListener("resize", resize);
      viewport?.removeEventListener("scroll", resize);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [expanded]);

  function expand() {
    setEditing(false);
    setExpanded(true);
  }

  function update(next: TranscriptionDoc) {
    saveTranscription(next);
    markSaved();
  }

  return (
    <div ref={containerRef} className={`${styles.container} ${expanded ? styles.expanded : ""}`}>
      {expanded && (
        <div className={`${styles.compactToolbar} items-center gap-2 border-b px-3 py-1`}>
          <span className="mr-auto text-sm font-medium">필사</span>
          <SaveStatus saving={saving} />
          <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
            <Minimize2 aria-hidden="true" />화면 줄이기
          </Button>
        </div>
      )}
      <div className={`${styles.details} flex flex-wrap items-center gap-2 border-b px-4 py-2`}>
        <a href={SOURCE_URL} target="_blank" rel="noreferrer" className="min-w-0 text-sm underline underline-offset-4">{SOURCE_TITLE} · 출처</a>
        <SaveStatus saving={saving} className="ml-auto" />
        <Button variant="ghost" size="sm" className="md:hidden" onClick={expand}>
          <Maximize2 aria-hidden="true" />화면 넓게
        </Button>
      </div>
      <div className={`${styles.panes} grid min-h-0 flex-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1`}>
        <section aria-label="필사 원문" className="flex min-h-0 min-w-0 flex-col border-b md:border-r md:border-b-0">
          <div className={`${styles.sourceToolbar} flex flex-wrap items-center gap-2 border-b px-4 py-2`}>
            <h2 className="mr-auto text-sm font-medium">원문</h2>
            <Button variant="ghost" size="sm" disabled={!loaded} aria-pressed={editing} onClick={() => setEditing(!editing)}>
              <Pencil aria-hidden="true" />{editing ? "편집 마치기" : "원문 편집"}
            </Button>
            <Button variant="ghost" size="sm" disabled={!loaded || !DEFAULT_SOURCE} onClick={() => setRestoreOpen(true)}>
              <RotateCcw aria-hidden="true" />기본 원문 복원
            </Button>
          </div>
          {editing ? (
            <textarea aria-label="원문 편집" autoFocus value={doc.source} readOnly={!loaded}
              onChange={(event) => update({ ...doc, source: event.target.value })}
              className="min-h-0 flex-1 resize-none bg-transparent p-4 text-base leading-8 outline-none" />
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap break-words p-4 text-base leading-8">
              {doc.source || "원문 편집을 눌러 필사할 글을 입력하세요."}
            </div>
          )}
        </section>
        <section aria-label="필사 입력" className="flex min-h-0 min-w-0 flex-col">
          <h2 className="border-b px-4 py-2 text-sm font-medium">필사</h2>
          <textarea aria-label="필사 본문" onFocus={() => { if (window.matchMedia("(max-width: 767px)").matches) expand(); }} value={doc.text} readOnly={!loaded} spellCheck={false}
            onChange={(event) => {
              update({ ...doc, text: event.target.value });
              setCursor(event.target.selectionStart);
            }}
            onSelect={(event) => setCursor(event.currentTarget.selectionStart)}
            className="min-h-0 flex-1 resize-none bg-transparent px-4 py-0 text-base outline-none"
            style={{ lineHeight: "2rem", backgroundImage: "repeating-linear-gradient(to bottom, transparent 0, transparent calc(2rem - 1px), var(--border) calc(2rem - 1px), var(--border) 2rem)", backgroundAttachment: "local" }} />
        </section>
      </div>
      <div className={styles.status}><MemoStatus doc={{ text: doc.text, format: "txt" }} cursor={cursor} /></div>
      <AlertDialog open={restoreOpen} onOpenChange={setRestoreOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>기본 원문으로 복원할까요?</AlertDialogTitle>
            <AlertDialogDescription>편집한 원문은 기본 원문으로 바뀝니다. 필사한 글은 그대로 유지됩니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => { update({ ...doc, source: DEFAULT_SOURCE }); setRestoreOpen(false); }}>복원</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
