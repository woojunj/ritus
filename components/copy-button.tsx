"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

const COPIED_MS = 1500;

// 글을 클립보드로 복사하는 아이콘 버튼. 복사하면 잠깐 체크 표시로 바뀐다.
export function CopyButton({
  getText,
  className,
}: {
  /** 누르는 순간의 글을 돌려준다. */
  getText: () => string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getText());
    } catch {
      // 클립보드를 쓸 수 없는 환경에서는 복사됨으로 표시하지 않는다.
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      aria-label={copied ? "복사됨" : "클립보드로 복사"}
      onClick={handleCopy}
    >
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
    </Button>
  );
}
