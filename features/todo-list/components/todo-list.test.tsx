import { render, screen, fireEvent, act } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { TodoList } from "./todo-list";
import { loadItems, incrementCompletionCount } from "../lib/storage";

describe("TodoList", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("할 일을 추가하면 카드 전체가 타이머 링크가 되고 평상시에는 삭제 버튼이 노출되지 않는다", () => {
    render(<TodoList />);

    const input = screen.getByLabelText("새 할 일");
    const submitBtn = screen.getByRole("button", { name: "할 일 추가" });

    fireEvent.change(input, { target: { value: "리팩터링 작업" } });
    fireEvent.click(submitBtn);

    // 평상시: 카드 전체가 타이머 시작 링크
    const timerCard = screen.getByRole("link", { name: '"리팩터링 작업" 타이머 시작' });
    expect(timerCard).toBeInTheDocument();
    expect(timerCard).toHaveAttribute(
      "href",
      "/"
    );

    // 평상시에는 실수 삭제 방지를 위해 삭제 버튼이 아예 노출되지 않음
    expect(screen.queryByRole("button", { name: '"리팩터링 작업" 삭제' })).toBeNull();
  });

  test("편집 버튼을 누르면 삭제 버튼이 나타나고, 취소할 수 있다", () => {
    render(<TodoList />);

    const input = screen.getByLabelText("새 할 일");
    fireEvent.change(input, { target: { value: "실수로 누를 뻔한 일" } });
    fireEvent.click(screen.getByRole("button", { name: "할 일 추가" }));

    expect(screen.getByText("실수로 누를 뻔한 일")).toBeInTheDocument();

    // 편집 모드 진입
    fireEvent.click(screen.getByRole("button", { name: "할 일 편집" }));

    // 삭제 버튼 클릭 -> 확인 단계 노출
    fireEvent.click(screen.getByRole("button", { name: '"실수로 누를 뻔한 일" 삭제' }));

    const confirmBtn = screen.getByRole("button", { name: '"실수로 누를 뻔한 일" 삭제 확인' });
    const cancelBtn = screen.getByRole("button", { name: "삭제 취소" });
    expect(confirmBtn).toBeInTheDocument();
    expect(cancelBtn).toBeInTheDocument();

    // 취소 클릭
    fireEvent.click(cancelBtn);
    expect(screen.getByText("실수로 누를 뻔한 일")).toBeInTheDocument();

    // 편집 완료 클릭 -> 다시 평상시 모드로 복귀
    fireEvent.click(screen.getByRole("button", { name: "편집 완료" }));
    expect(screen.queryByRole("button", { name: '"실수로 누를 뻔한 일" 삭제' })).toBeNull();
  });

  test("편집 모드에서 삭제 확인을 누르면 할 일이 삭제된다", () => {
    render(<TodoList />);

    const input = screen.getByLabelText("새 할 일");
    fireEvent.change(input, { target: { value: "지울 일" } });
    fireEvent.click(screen.getByRole("button", { name: "할 일 추가" }));

    // 편집 모드 진입 후 삭제
    fireEvent.click(screen.getByRole("button", { name: "할 일 편집" }));
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

  test("저장 버튼을 누르면 할 일 목록을 CSV 파일로 내려받는다", async () => {
    let lastBlob: Blob | null = null;
    let downloadName = "";
    vi.stubGlobal(
      "URL",
      Object.assign(URL, {
        createObjectURL: vi.fn((blob: Blob) => {
          lastBlob = blob;
          return "blob:todos";
        }),
        revokeObjectURL: vi.fn(),
      })
    );
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        downloadName = this.download;
      });

    render(<TodoList />);
    fireEvent.change(screen.getByLabelText("새 할 일"), { target: { value: "글쓰기" } });
    fireEvent.click(screen.getByRole("button", { name: "할 일 추가" }));
    fireEvent.click(screen.getByRole("button", { name: "파일로 저장" }));

    expect(downloadName).toMatch(/^ritus-todos-\d{8}\.csv$/);
    const bytes = new Uint8Array(await lastBlob!.arrayBuffer());
    // 엑셀이 한글을 읽도록 UTF-8 BOM으로 시작한다.
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(new TextDecoder().decode(bytes)).toBe("할 일,완주 횟수\n글쓰기,0");
    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  test("복사 버튼을 누르면 할 일과 완주 횟수가 CSV로 클립보드에 담긴다", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", Object.assign(navigator, { clipboard: { writeText } }));

    render(<TodoList />);
    const input = screen.getByLabelText("새 할 일");
    fireEvent.change(input, { target: { value: "글쓰기" } });
    fireEvent.click(screen.getByRole("button", { name: "할 일 추가" }));
    fireEvent.change(input, { target: { value: '읽기, "메모"' } });
    fireEvent.click(screen.getByRole("button", { name: "할 일 추가" }));
    act(() => {
      incrementCompletionCount(loadItems().find((item) => item.title === "글쓰기")!.id);
    });

    fireEvent.click(screen.getByRole("button", { name: "클립보드로 복사" }));

    expect(writeText).toHaveBeenCalledWith(
      '할 일,완주 횟수\n"읽기, ""메모""",0\n글쓰기,1'
    );
    expect(await screen.findByRole("button", { name: "복사됨" })).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
