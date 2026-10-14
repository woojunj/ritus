"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ClipboardPaste, Plus, Search, Trash2, X } from "lucide-react";

import { DownloadButton } from "@/components/download-button";
import { ConscienceIcon } from "@/components/conscience-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadButton } from "@/components/upload-button";

import { DeleteNoteDialog } from "./components/delete-note-dialog";
import { HelperLink } from "./components/helper-link";
import { NoteSheet } from "./components/note-sheet";
import { PasteDialog } from "./components/paste-dialog";
import { RadarChart } from "./components/radar-chart";
import {
  allNotesFile,
  mergePastedNote,
  newNotesOnly,
  parseNotes,
  parsePastedNotes,
} from "./lib/copy-text";
import { COPYRIGHT_NOTICE } from "./lib/form";
import {
  matchedFieldLabels,
  noteMatches,
  searchTerms,
} from "./lib/search";
import {
  createNote,
  formatNoteDate,
  getNotesServerSnapshot,
  getNotesSnapshot,
  noteLevels,
  saveNotes,
  sortNotes,
  subscribeNotes,
  type ConscienceNoteItem,
} from "./lib/storage";

const NOTICE_MS = 3000;

// 양심노트 화면. 사안마다 한 장씩 쌓이는 목록과, 그중 한 장을 쓰는 화면을 오간다.
export function ConscienceNote() {
  const notes = useSyncExternalStore(
    subscribeNotes,
    getNotesSnapshot,
    getNotesServerSnapshot
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const [justCreated, setJustCreated] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    },
    []
  );
  const openNote = notes.find((note) => note.id === openId);

  // 검색은 목록에서만 쓴다. 한 장을 열면 검색 칸과 검색어를 함께 지운다.
  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
  }

  const terms = searchTerms(query);
  const visibleNotes = searchOpen
    ? sortNotes(notes).filter((note) => noteMatches(note, terms))
    : sortNotes(notes);

  function handleCreate() {
    const note = createNote();
    saveNotes([note, ...notes]);
    closeSearch();
    setOpenId(note.id);
    setJustCreated(true);
  }

  function handleChange(next: ConscienceNoteItem) {
    saveNotes(notes.map((note) => (note.id === next.id ? next : note)));
  }

  // 내려받은 파일의 한 장들을 목록에 더한다. 이미 있는 것과 같은 한 장은 건너뛴다.
  function handleImport(text: string) {
    const added = newNotesOnly(parseNotes(text), notes);
    if (added.length > 0) saveNotes([...added, ...notes]);
  }

  // 더해진 것이 없을 때 고장으로 보이지 않도록 까닭을 잠깐 알린다.
  function showNotice(message: string) {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), NOTICE_MS);
  }

  // 붙여넣은 글을 한 장으로 만든다. 한 장만 들어오면 채워진 모습을 바로 보여 준다.
  // 한 장이 열려 있으면 새로 만들지 않고 그 한 장에 더한다.
  function addPasted(text: string) {
    const parsed = parsePastedNotes(text);
    if (parsed.length === 0) {
      showNotice("붙여넣을 글이 없습니다");
      return;
    }
    if (openNote) {
      // 여러 사안을 한 장에 섞지 않는다. 여러 장은 목록에서 각각의 한 장이 된다.
      if (parsed.length > 1) {
        showNotice("여러 장은 목록에서 붙여넣어 주세요");
        return;
      }
      const merged = mergePastedNote(openNote, parsed[0]);
      if (merged) handleChange(merged);
      else showNotice("붙여넣을 글이 없습니다");
      return;
    }
    const added = newNotesOnly(parsed, notes);
    if (added.length === 0) {
      showNotice("이미 같은 양심노트가 있습니다");
      return;
    }
    saveNotes([...added, ...notes]);
    if (added.length === 1) {
      closeSearch();
      setOpenId(added[0].id);
      setJustCreated(false);
    }
  }

  async function handlePaste() {
    let text: string;
    try {
      text = await navigator.clipboard.readText();
    } catch {
      // 클립보드를 읽을 수 없거나 허락받지 못하면 직접 붙여넣는 창으로 이어 간다.
      setPasteDialogOpen(true);
      return;
    }
    addPasted(text);
  }

  function handleDelete(id: string) {
    saveNotes(notes.filter((note) => note.id !== id));
    setOpenId(null);
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1">
        {openNote ? (
          <NoteSheet
            key={openNote.id}
            note={openNote}
            focusMatter={justCreated}
            notice={notice}
            onChange={handleChange}
            onPaste={handlePaste}
            onBack={() => setOpenId(null)}
            onDelete={() => handleDelete(openNote.id)}
          />
        ) : (
          <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <h1 className="font-heading text-lg font-semibold">양심노트</h1>
                {notes.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground"
                    title="양심노트 검색"
                    aria-expanded={searchOpen}
                    onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
                  >
                    <Search aria-hidden="true" />
                    <span className="sr-only">양심노트 검색</span>
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-1">
                <HelperLink />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground"
                  onClick={handlePaste}
                  title="클립보드에서 붙여넣기"
                >
                  <ClipboardPaste aria-hidden="true" />
                  <span className="sr-only">클립보드에서 붙여넣기</span>
                </Button>
                <UploadButton
                  accept=".txt,text/plain"
                  label="양심노트 불러오기"
                  onText={handleImport}
                  className="text-muted-foreground"
                />
                {notes.length > 0 && (
                  <DownloadButton
                    getFile={() => allNotesFile(notes)}
                    label="모두 파일로 저장"
                    className="text-muted-foreground"
                  />
                )}
                <Button type="button" size="icon" title="새 양심노트 쓰기" onClick={handleCreate}>
                  <Plus aria-hidden="true" />
                  <span className="sr-only">새 양심노트 쓰기</span>
                </Button>
              </div>
            </div>

            {searchOpen && (
              <div className="flex items-center gap-1">
                <Input
                  type="search"
                  aria-label="양심노트 검색"
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

            {notice && (
              <p role="status" className="-mt-3 text-center text-sm text-muted-foreground">
                {notice}
              </p>
            )}

            {notes.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-20 text-center text-muted-foreground">
                <ConscienceIcon className="h-10 w-10 opacity-20" aria-hidden="true" />
                <p className="text-sm">양심노트를 쓰면 여기에 나타납니다</p>
              </div>
            ) : visibleNotes.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                일치하는 양심노트가 없습니다
              </p>
            ) : (
              <ul className="flex flex-col gap-2" role="list">
                {visibleNotes.map((note) => {
                  const firstLine = note.matter.trim().split("\n")[0];
                  const date = formatNoteDate(note.date);
                  const levels = noteLevels(note);
                  const labels = matchedFieldLabels(note, terms);
                  const hasLevel = Object.values(levels).some(
                    (level) => level !== null
                  );
                  return (
                    <li
                      key={note.id}
                      className="flex items-stretch overflow-hidden rounded-xl border bg-card shadow-xs transition-shadow hover:shadow-md"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          closeSearch();
                          setOpenId(note.id);
                          setJustCreated(false);
                        }}
                        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40 active:bg-accent/60"
                      >
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {date}
                          </span>
                          {firstLine && (
                            <span className="truncate text-sm font-medium leading-snug">
                              {firstLine}
                            </span>
                          )}
                          {labels.length > 0 && (
                            <span className="truncate text-xs text-muted-foreground">
                              {labels.join(", ")}
                            </span>
                          )}
                        </span>
                        {/* 신호를 하나라도 고른 한 장은 그 모양을 작게 보여 준다. */}
                        {hasLevel && (
                          <RadarChart levels={levels} compact className="shrink-0" />
                        )}
                      </button>
                      <div className="flex shrink-0 items-center pr-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeletingId(note.id)}
                          aria-label={`"${firstLine || date}" 삭제`}
                          title={`"${firstLine || date}" 삭제`}
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
      <DeleteNoteDialog
        open={deletingId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null);
        }}
        onConfirm={() => {
          if (deletingId) handleDelete(deletingId);
        }}
      />
      <PasteDialog
        open={pasteDialogOpen}
        onOpenChange={setPasteDialogOpen}
        onSubmit={addPasted}
      />
      <p className="border-t px-4 py-2 text-center text-xs text-muted-foreground">
        {COPYRIGHT_NOTICE}
      </p>
    </div>
  );
}
