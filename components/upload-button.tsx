"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";

// 파일을 골라 그 글을 넘겨주는 아이콘 버튼.
export function UploadButton({
  accept,
  onText,
  label = "파일 불러오기",
  className,
}: {
  /** 예: ".txt" */
  accept: string;
  onText: (text: string) => void;
  label?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        aria-label={`${label} 파일`}
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          // 같은 파일을 다시 골라도 불러올 수 있게 비운다.
          e.target.value = "";
          if (file) onText(await file.text());
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={className}
        aria-label={label}
        onClick={() => inputRef.current?.click()}
      >
        <Upload aria-hidden="true" />
      </Button>
    </>
  );
}
