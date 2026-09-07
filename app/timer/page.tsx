"use client";

import { Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { FocusTimer } from "@/features/focus-timer";
import { incrementCompletionCount } from "@/features/todo-list";

function TimerContent() {
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
      backHref="/todos"
      todoHref="/todos"
      initialTitle={title}
      onFinish={handleFinish}
    />
  );
}

export default function TimerPage() {
  return (
    <Suspense fallback={<FocusTimer backHref="/todos" todoHref="/todos" />}>
      <TimerContent />
    </Suspense>
  );
}


