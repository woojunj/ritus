"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { LEVELS, VIRTUES, type VirtueKey } from "../lib/form";
import type { ConscienceNoteItem } from "../lib/storage";
import { RadarChart } from "./radar-chart";

interface NoteSheetProps {
  note: ConscienceNoteItem;
  /** 막 만든 한 장이면 사안 칸에 바로 입력할 수 있게 한다. */
  focusMatter?: boolean;
  onChange: (note: ConscienceNoteItem) => void;
  onBack: () => void;
  onDelete: () => void;
}

// components/ui/input.tsx와 같은 모양의 여러 줄 입력 칸.
function TextArea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "block min-h-20 w-full resize-y rounded-2xl border border-transparent bg-input/50 px-3 py-2 text-base leading-relaxed transition-[color,box-shadow] duration-200 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 md:text-sm",
        className
      )}
      {...props}
    />
  );
}

const ROW_CLASS = "grid gap-2 border-t py-4 sm:grid-cols-[4rem_1fr] sm:gap-4";
const NAME_CLASS = "font-heading text-sm font-semibold sm:pt-1.5";

export function NoteSheet({
  note,
  focusMatter = false,
  onChange,
  onBack,
  onDelete,
}: NoteSheetProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const matterRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (focusMatter) matterRef.current?.focus();
  }, [focusMatter]);

  const updateVirtue = (
    key: VirtueKey,
    patch: Partial<ConscienceNoteItem["virtues"][VirtueKey]>
  ) => {
    onChange({
      ...note,
      virtues: { ...note.virtues, [key]: { ...note.virtues[key], ...patch } },
    });
  };

  const levels = Object.fromEntries(
    VIRTUES.map((virtue) => [virtue.key, note.virtues[virtue.key].level])
  ) as Record<VirtueKey, number | null>;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4 py-4">
      <div className="flex items-center justify-between pb-3">
        <Button type="button" variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft aria-hidden="true" />
          <span className="sr-only">목록으로</span>
        </Button>
        <Input
          type="date"
          aria-label="날짜"
          value={note.date}
          onChange={(e) => {
            // 날짜를 지우면 목록에서 자리를 잃으므로 빈 값은 받지 않는다.
            if (e.target.value) onChange({ ...note, date: e.target.value });
          }}
          className="w-auto"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setConfirmingDelete(true)}
        >
          <Trash2 aria-hidden="true" />
          <span className="sr-only">양심노트 삭제</span>
        </Button>
      </div>

      <section className={ROW_CLASS}>
        <label htmlFor="conscience-matter" className={NAME_CLASS}>
          사안
        </label>
        <TextArea
          id="conscience-matter"
          ref={matterRef}
          value={note.matter}
          onChange={(e) => onChange({ ...note, matter: e.target.value })}
          className="min-h-28"
        />
      </section>

      {VIRTUES.map((virtue) => {
        const entry = note.virtues[virtue.key];
        const fieldId = `conscience-${virtue.key}`;
        return (
          <section key={virtue.key} className={ROW_CLASS}>
            <label htmlFor={fieldId} className={NAME_CLASS}>
              {virtue.name}
            </label>
            <div className="flex min-w-0 flex-col gap-2">
              <div className="text-sm text-muted-foreground sm:pt-1.5">
                {virtue.questions.map((question) => (
                  <p key={question}>{question}</p>
                ))}
              </div>
              <TextArea
                id={fieldId}
                value={entry.text}
                onChange={(e) => updateVirtue(virtue.key, { text: e.target.value })}
              />
              <div
                role="group"
                aria-label={`${virtue.name} 단계`}
                className="flex flex-wrap gap-1"
              >
                {LEVELS.map((level, index) => {
                  const pressed = entry.level === index;
                  return (
                    <Button
                      key={level}
                      type="button"
                      size="sm"
                      variant={pressed ? "default" : "outline"}
                      aria-pressed={pressed}
                      onClick={() =>
                        updateVirtue(virtue.key, { level: pressed ? null : index })
                      }
                    >
                      {level}
                    </Button>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}

      <section className={ROW_CLASS}>
        <label htmlFor="conscience-conclusion" className={NAME_CLASS}>
          최종 결론
        </label>
        <div className="flex min-w-0 flex-col items-center gap-4 md:flex-row md:items-start">
          <TextArea
            id="conscience-conclusion"
            value={note.conclusion}
            onChange={(e) => onChange({ ...note, conclusion: e.target.value })}
            className="min-h-40 md:min-h-56 md:flex-1"
          />
          <RadarChart levels={levels} className="shrink-0 md:w-64" />
        </div>
      </section>

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>이 양심노트를 지울까요?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmingDelete(false);
                onDelete();
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
