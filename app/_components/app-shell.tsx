"use client";

import type { ReactNode } from "react";

import { FocusSessionProvider } from "@/features/focus-timer";
import { incrementCompletionCount } from "@/features/todo-list";

import { AppHeader } from "./app-header";

function handleFinish(todoId: string | undefined) {
  if (todoId) {
    incrementCompletionCount(todoId);
  }
}

// 세 화면의 공통 틀. 세션 상태와 헤더를 레이아웃에 두어 화면을 옮겨도
// 세션이 이어지게 하고, 세션 완주를 할 일의 완주 횟수로 잇는다.
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <FocusSessionProvider onFinish={handleFinish}>
      <div className="flex h-dvh flex-col">
        <AppHeader />
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {children}
        </main>
      </div>
    </FocusSessionProvider>
  );
}
