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
  backupIssueSummary,
  backupSummary,
  backupTextSize,
  currentBackup,
  parseBackup,
  restoreBackup,
  type Backup,
  type BackupIssues,
} from "./backup";

// 양심노트, 메모, 할 일을 한 파일로 저장하고 되살리는 헤더 버튼.
// 불러오면 지금 내용이 사라지므로 무엇이 바뀌는지 보여 주고 확인을 받는다.
export function BackupButton() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<{ backup: Backup; issues: BackupIssues } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [transfer, setTransfer] = useState<"copy" | "paste" | null>(null);
  const [exportText, setExportText] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [source, setSource] = useState<"file" | "clipboard">("file");
  const inputRef = useRef<HTMLInputElement>(null);
  const size = backupTextSize(exportText);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setPending(null);
      setError(null);
      setTransfer(null);
      setPasteText("");
      setExportText("");
      setMessage(null);
    }
    setOpen(next);
  };

  function readBackup(text: string, from: "file" | "clipboard") {
    const parsed = parseBackup(text);
    setPending(parsed);
    setSource(from);
    setError(parsed ? null : from === "file" ? "ritus 백업 파일이 아닙니다" : "ritus 전체 백업 글이 아닙니다. 복사한 내용을 빠짐없이 붙여넣어 주세요.");
    if (parsed) { setTransfer(null); setMessage(null); }
    else if (from === "clipboard") setTransfer("paste");
  }

  async function copyBackup() {
    const text = backupFile(currentBackup()).text;
    setExportText(text);
    setError(null);
    try {
      await navigator.clipboard.writeText(text);
      setTransfer(null);
      setMessage("전체 백업을 복사했습니다. 옮길 곳의 ‘전체 백업 → 붙여넣기’에서 복원하세요.");
    } catch {
      setTransfer("copy");
      setMessage("자동 복사에 실패했습니다. 브라우저의 클립보드 접근 제한이나 자료 크기 때문일 수 있습니다. 아래 글을 전체 선택한 뒤 직접 복사해 보세요.");
    }
  }

  async function pasteBackup() {
    setError(null);
    setMessage(null);
    setPasteText("");
    try {
      const text = await navigator.clipboard.readText();
      setPasteText(text);
      readBackup(text, "clipboard");
    } catch {
      setTransfer("paste");
      setMessage("클립보드를 자동으로 읽을 수 없습니다. 아래 칸을 길게 누르거나 Ctrl+V·Cmd+V로 직접 붙여넣으세요.");
    }
  }

  return (
    <>
      <Button type="button" variant="ghost" size="icon" title="전체 백업" onClick={() => { setExportText(backupFile(currentBackup()).text); setOpen(true); }}>
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
          readBackup(await file.text(), "file");
        }}
      />
      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent className="max-h-[90dvh] overflow-y-auto">
          {pending ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>백업 {source === "file" ? "파일" : "글"}의 내용으로 바꿀까요?</AlertDialogTitle>
                <AlertDialogDescription>
                  지금 내용은 사라지고 백업 {source === "file" ? "파일" : "글"}의 내용으로 바뀝니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <dt className="text-muted-foreground">지금</dt>
                <dd>{backupSummary(currentBackup())}</dd>
                <dt className="text-muted-foreground">백업 {source === "file" ? "파일" : "글"}</dt>
                <dd>{backupSummary(pending.backup)}</dd>
              </dl>
              {/* 망가진 항목을 바로잡거나 건너뛴 것을 바꾸기 전에 알린다. */}
              {backupIssueSummary(pending.issues) && (
                <p role="alert" className="text-sm text-destructive">
                  {backupIssueSummary(pending.issues)}
                </p>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    restoreBackup(pending.backup);
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
                  양심노트, 메모, 할 일을 파일이나 복사한 글로 옮깁니다. 불러오기는 현재 내용 전체를 바꿉니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex flex-col gap-3 text-sm">
                <p>백업 크기: {size.characters.toLocaleString()}자 · {size.bytes.toLocaleString()}바이트</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button type="button" variant="outline" onClick={copyBackup}>클립보드에 복사</Button>
                  <Button type="button" variant="outline" onClick={pasteBackup}>붙여넣기</Button>
                </div>
                {message && <p role="status">{message}</p>}
                {transfer === "copy" && <div className="flex flex-col gap-2">
                  <label htmlFor="backup-copy-text">직접 복사할 전체 백업</label>
                  <textarea id="backup-copy-text" readOnly value={exportText} onFocus={event => event.currentTarget.select()} className="h-32 w-full rounded-md border bg-background p-2 text-sm" />
                  <p className="text-muted-foreground">이 칸을 누르면 전체 글이 선택됩니다. 기기의 복사 메뉴를 사용하세요.</p>
                  <p className="text-muted-foreground">직접 복사도 어렵고 자료가 많다면 기능별로 나눠 옮겨 보세요. 양심노트는 한 장씩, 메모장은 저장한 글을 하나씩 열어 복사할 수 있습니다. 할 일은 목록만 따로 복사해 보관할 수 있습니다.</p>
                  <p className="text-muted-foreground">기능별 복사는 전체 백업 복원과 달라 일부 정보는 직접 옮겨야 합니다. 파일 저장이 가능한 환경에서는 각 화면의 파일 저장도 사용할 수 있습니다. 옮긴 내용을 확인할 때까지 원본을 남겨 두세요.</p>
                </div>}
                {transfer === "paste" && <div className="flex flex-col gap-2">
                  <label htmlFor="backup-paste-text">전체 백업 글 붙여넣기</label>
                  <textarea id="backup-paste-text" value={pasteText} onChange={event => setPasteText(event.target.value)} className="h-32 w-full rounded-md border bg-background p-2 text-sm" />
                  <Button type="button" disabled={!pasteText.trim()} onClick={() => readBackup(pasteText, "clipboard")}>내용 확인</Button>
                </div>}
              </div>
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
