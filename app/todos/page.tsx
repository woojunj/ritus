"use client";

import { useRouter } from "next/navigation";

import { SessionBar, useFocusSession } from "@/features/focus-timer";
import { TodoList, type TodoItem } from "@/features/todo-list";

export default function TodosPage() {
  const router = useRouter();
  const { phase, todoId, prepare } = useFocusSession();
  const sessionActive = phase === "running" || phase === "paused";

  // 지금 세션을 시작한 바로 그 할 일을 다시 누르면 세션을 건드리지 않는다.
  const isCurrentSession = (item: TodoItem) =>
    sessionActive && item.id === todoId;

  return (
    <>
      <SessionBar />
      <TodoList
        shouldConfirmStart={(item) => sessionActive && !isCurrentSession(item)}
        onStartTimer={(item) => {
          if (!isCurrentSession(item)) {
            prepare({ title: item.title, todoId: item.id });
          }
          router.push("/");
        }}
      />
    </>
  );
}
