"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { downloadTextFile, type TextFile } from "@/lib/download";

// 글을 파일로 내려받는 아이콘 버튼.
export function DownloadButton({
  getFile,
  className,
}: {
  /** 누르는 순간의 글과 파일 이름을 돌려준다. */
  getFile: () => TextFile;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      aria-label="파일로 저장"
      onClick={() => downloadTextFile(getFile())}
    >
      <Download aria-hidden="true" />
    </Button>
  );
}
