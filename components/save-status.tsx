"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

const SAVING_MS = 600;

/**
 * 자동 저장 표시의 상태. 저장할 때마다 markSaved를 부르면 잠깐 "저장 중"이
 * 되었다가 "자동 저장됨"으로 돌아온다.
 */
export function useSaveStatus() {
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markSaved = useCallback(() => {
    setSaving(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaving(false), SAVING_MS);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  return { saving, markSaved };
}

// 저장 버튼이 없는 화면에서 쓴 내용이 저절로 남는다는 것을 알린다.
export function SaveStatus({
  saving,
  className,
}: {
  saving: boolean;
  className?: string;
}) {
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-1 text-xs whitespace-nowrap text-muted-foreground",
        className
      )}
    >
      {saving ? (
        <LoaderCircle className="size-3 animate-spin" aria-hidden="true" />
      ) : (
        <Check className="size-3" aria-hidden="true" />
      )}
      {saving ? "저장 중…" : "자동 저장됨"}
    </span>
  );
}
