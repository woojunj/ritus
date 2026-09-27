"use client";

import { Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";

import { FocusTimer } from "@/features/focus-timer";
import { incrementCompletionCount } from "@/features/todo-list";

interface FocusSessionEntryProps {
  /** 제공 시 헤더 왼쪽에 뒤로가기 링크를 표시한다. */
  backHref?: string;
}

function FocusSessionEntryContent({ backHref }: FocusSessionEntryProps) {
  const searchParams = useSearchParams();
  const title = searchParams?.get("title") ?? undefined;
  const todoId = searchParams?.get("todoId") ?? undefined;

  const handleFinish = useCallback(() => {
    if (todoId) {
      incrementCompletionCount(todoId);
    }
  }, [todoId]);

  return (
    <FocusTimer
      backHref={backHref}
      todoHref="/todos"
      initialTitle={title}
      onFinish={handleFinish}
    />
  );
}

// /와 /timer는 둘 다 뒤로가기 링크 유무만 다를 뿐, 할 일 파라미터를 읽어
// 타이머에 넘기고 완주 시 완주 횟수를 올리는 로직은 동일하다. 그 중복을
// 여기 하나로 모은다.
export function FocusSessionEntry({ backHref }: FocusSessionEntryProps) {
  return (
    <Suspense fallback={<FocusTimer backHref={backHref} todoHref="/todos" />}>
      <FocusSessionEntryContent backHref={backHref} />
    </Suspense>
  );
}
