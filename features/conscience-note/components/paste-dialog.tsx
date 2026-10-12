"use client";

import { useState } from "react";

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

interface PasteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (text: string) => void;
}

// 브라우저가 클립보드 읽기를 허용하지 않을 때 직접 붙여넣는 창.
// 입력 칸에 붙여넣는 것은 권한 없이도 된다.
export function PasteDialog({ open, onOpenChange, onSubmit }: PasteDialogProps) {
  const [text, setText] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (!next) setText("");
    onOpenChange(next);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>여기에 붙여넣어 주세요</AlertDialogTitle>
          <AlertDialogDescription>
            브라우저가 클립보드 읽기를 허용하지 않아 직접 붙여넣어야 합니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <textarea
          aria-label="붙여넣을 글"
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="block h-40 w-full resize-none rounded-2xl border border-transparent bg-input/50 px-3 py-2 text-base leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 md:text-sm"
        />
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            disabled={!text.trim()}
            onClick={() => {
              onSubmit(text);
              handleOpenChange(false);
            }}
          >
            양식에 채우기
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
