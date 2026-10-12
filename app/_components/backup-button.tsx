"use client";

import { useRef, useState } from "react";
import { DatabaseBackup } from "lucide-react";

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
import { downloadTextFile } from "@/lib/download";

import {
  backupFile,
  backupSummary,
  currentBackup,
  parseBackup,
  restoreBackup,
  type Backup,
} from "./backup";

// 양심노트, 메모, 할 일을 한 파일로 저장하고 되살리는 헤더 버튼.
// 불러오면 지금 내용이 사라지므로 무엇이 바뀌는지 보여 주고 확인을 받는다.
export function BackupButton() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Backup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setPending(null);
      setError(null);
    }
    setOpen(next);
  };

  return (
    <>
      <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <DatabaseBackup aria-hidden="true" />
        <span className="sr-only">전체 백업</span>
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        aria-label="백업 파일"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          // 같은 파일을 다시 골라도 불러올 수 있게 비운다.
          e.target.value = "";
          if (!file) return;
          const backup = parseBackup(await file.text());
          setPending(backup);
          setError(backup ? null : "ritus 백업 파일이 아닙니다");
        }}
      />
      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          {pending ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>백업 파일의 내용으로 바꿀까요?</AlertDialogTitle>
                <AlertDialogDescription>
                  지금 내용은 사라지고 백업 파일의 내용으로 바뀝니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <dt className="text-muted-foreground">지금</dt>
                <dd>{backupSummary(currentBackup())}</dd>
                <dt className="text-muted-foreground">백업 파일</dt>
                <dd>{backupSummary(pending)}</dd>
              </dl>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    restoreBackup(pending);
                    handleOpenChange(false);
                  }}
                >
                  바꾸기
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>전체 백업</AlertDialogTitle>
                <AlertDialogDescription>
                  양심노트, 메모, 할 일을 한 파일로 저장하거나, 저장해 둔 파일로 되살립니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel>닫기</AlertDialogCancel>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => inputRef.current?.click()}
                >
                  불러오기
                </Button>
                <AlertDialogAction
                  onClick={() => {
                    downloadTextFile(backupFile(currentBackup()));
                    handleOpenChange(false);
                  }}
                >
                  전체 저장
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
