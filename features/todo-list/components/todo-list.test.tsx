import { render, screen, fireEvent, act } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";

import { TodoList } from "./todo-list";
import { loadItems, incrementCompletionCount } from "../lib/storage";

describe("TodoList", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("할 일을 추가하면 목록에 나타나고 제목 클릭 시 타이머 링크를 가진다", () => {
    render(<TodoList />);

    const input = screen.getByLabelText("새 할 일");
    const submitBtn = screen.getByRole("button", { name: "할 일 추가" });

    fireEvent.change(input, { target: { value: "리팩터링 작업" } });
    fireEvent.click(submitBtn);

    const titleLink = screen.getByRole("link", { name: "리팩터링 작업" });
    expect(titleLink).toBeInTheDocument();
    expect(titleLink).toHaveAttribute(
      "href",
      expect.stringContaining("/?todoId=")
    );

    const timerBtn = screen.getByRole("link", { name: '"리팩터링 작업" 타이머 시작' });
    expect(timerBtn).toBeInTheDocument();
    expect(timerBtn).toHaveAttribute(
      "href",
      expect.stringContaining("/?todoId=")
    );
  });

  test("삭제 버튼을 누르면 바로 삭제되지 않고 확인 단계가 뜨며, 취소할 수 있다", () => {
    render(<TodoList />);

    const input = screen.getByLabelText("새 할 일");
    fireEvent.change(input, { target: { value: "실수로 누를 뻔한 일" } });
    fireEvent.click(screen.getByRole("button", { name: "할 일 추가" }));

    expect(screen.getByText("실수로 누를 뻔한 일")).toBeInTheDocument();

    // 삭제 버튼 클릭 -> 즉시 삭제되지 않고 확인 버튼 노출
    fireEvent.click(screen.getByRole("button", { name: '"실수로 누를 뻔한 일" 삭제' }));

    const confirmBtn = screen.getByRole("button", { name: '"실수로 누를 뻔한 일" 삭제 확인' });
    const cancelBtn = screen.getByRole("button", { name: "삭제 취소" });
    expect(confirmBtn).toBeInTheDocument();
    expect(cancelBtn).toBeInTheDocument();

    // 취소 클릭
    fireEvent.click(cancelBtn);
    expect(screen.getByText("실수로 누를 뻔한 일")).toBeInTheDocument();
  });

  test("삭제 확인을 누르면 할 일이 삭제된다", () => {
    render(<TodoList />);

    const input = screen.getByLabelText("새 할 일");
    fireEvent.change(input, { target: { value: "지울 일" } });
    fireEvent.click(screen.getByRole("button", { name: "할 일 추가" }));

    fireEvent.click(screen.getByRole("button", { name: '"지울 일" 삭제' }));
    fireEvent.click(screen.getByRole("button", { name: '"지울 일" 삭제 확인' }));
    expect(screen.queryByText("지울 일")).toBeNull();
  });

  test("완주 횟수가 증가하면 목록에 ×1 배지가 표시된다", () => {
    render(<TodoList />);

    const input = screen.getByLabelText("새 할 일");
    fireEvent.change(input, { target: { value: "완주할 목표" } });
    fireEvent.click(screen.getByRole("button", { name: "할 일 추가" }));

    expect(screen.queryByText("×1")).toBeNull();

    const items = loadItems();
    const target = items.find((item) => item.title === "완주할 목표");
    expect(target).toBeDefined();

    act(() => {
      incrementCompletionCount(target!.id);
    });

    expect(screen.getByText("×1")).toBeInTheDocument();
  });
});
