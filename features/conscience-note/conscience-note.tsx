"use client";

import { useState, useSyncExternalStore } from "react";
import { Hexagon, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { DeleteNoteDialog } from "./components/delete-note-dialog";
import { NoteSheet } from "./components/note-sheet";
import { RadarChart } from "./components/radar-chart";
import { COPYRIGHT_NOTICE } from "./lib/form";
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
  const openNote = notes.find((note) => note.id === openId);

  function handleCreate() {
    const note = createNote();
    saveNotes([note, ...notes]);
    setOpenId(note.id);
    setJustCreated(true);
  }

  function handleChange(next: ConscienceNoteItem) {
    saveNotes(notes.map((note) => (note.id === next.id ? next : note)));
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
            onChange={handleChange}
            onBack={() => setOpenId(null)}
            onDelete={() => handleDelete(openNote.id)}
          />
        ) : (
          <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8">
            <div className="flex items-center justify-between">
              <h1 className="font-heading text-lg font-semibold">양심노트</h1>
              <Button type="button" size="icon" onClick={handleCreate}>
                <Plus aria-hidden="true" />
                <span className="sr-only">새 양심노트 쓰기</span>
              </Button>
            </div>

            {notes.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-20 text-center text-muted-foreground">
                <Hexagon className="h-10 w-10 opacity-20" aria-hidden="true" />
                <p className="text-sm">양심노트를 쓰면 여기에 나타납니다</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2" role="list">
                {sortNotes(notes).map((note) => {
                  const firstLine = note.matter.trim().split("\n")[0];
                  const date = formatNoteDate(note.date);
                  const levels = noteLevels(note);
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
                        </span>
                        {/* 단계를 하나라도 고른 한 장은 그 모양을 작게 보여 준다. */}
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
      <p className="border-t px-4 py-2 text-center text-xs text-muted-foreground">
        {COPYRIGHT_NOTICE}
      </p>
    </div>
  );
}
