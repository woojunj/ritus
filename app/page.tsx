"use client";

import { Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { FocusTimer } from "@/features/focus-timer";
import { incrementCompletionCount } from "@/features/todo-list";

function HomeContent() {
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
      todoHref="/todos"
      initialTitle={title}
      onFinish={handleFinish}
    />
  );
}

export default function Home() {
  return (
    <Suspense fallback={<FocusTimer todoHref="/todos" />}>
      <HomeContent />
    </Suspense>
  );
}


