import { render, screen, fireEvent, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import Home from "@/app/page";
import { saveItems, loadItems } from "@/features/todo-list";

let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/features/focus-timer/lib/chime", () => ({
  playChime: vi.fn(),
}));

describe("Home", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    mockSearchParams = new URLSearchParams();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("홈 화면은 집중 세션 타이머 화면을 보여준다", () => {
    render(<Home />);

    expect(screen.getByRole("button", { name: "시작" })).toBeInTheDocument();
    expect(screen.getByLabelText("할 일 목록")).toBeInTheDocument();
  });

  test("할 일 파라미터(todoId, title)가 주어지면 제목이 설정되고 완주 시 완주 횟수가 1 증가한다", () => {
    const todoId = "todo-test-1";
    saveItems([
      {
        id: todoId,
        title: "알고리즘 문제 풀이",
        completionCount: 0,
        createdAt: Date.now(),
      },
    ]);

    mockSearchParams = new URLSearchParams({
      todoId,
      title: "알고리즘 문제 풀이",
    });

    render(<Home />);

    // 제목 필드에 반영되어 있는지 확인
    const titleInput = screen.getByLabelText("세션 제목");
    expect(titleInput).toHaveValue("알고리즘 문제 풀이");

    // 1분으로 설정하고 시작
    const minutesInput = screen.getByLabelText("시간(분)");
    fireEvent.change(minutesInput, { target: { value: "1" } });
    fireEvent.blur(minutesInput);

    fireEvent.click(screen.getByRole("button", { name: "시작" }));

    // 완주 전에는 completionCount가 0
    expect(loadItems().find((item) => item.id === todoId)?.completionCount).toBe(0);

    // 1분 경과 -> 세션 완주
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    // 완주 후 completionCount가 1로 증가했는지 확인
    expect(loadItems().find((item) => item.id === todoId)?.completionCount).toBe(1);
  });
});


