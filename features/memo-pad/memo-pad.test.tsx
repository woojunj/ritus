import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { MemoPad } from "./memo-pad";

function typeInto(textarea: HTMLElement, value: string) {
  fireEvent.change(textarea, { target: { value } });
  (textarea as HTMLTextAreaElement).setSelectionRange(value.length, value.length);
  fireEvent.select(textarea);
}

beforeEach(() => {
  localStorage.clear();
});

describe("일반 텍스트 메모장", () => {
  test("열자마자 입력할 수 있다", () => {
    render(<MemoPad />);
    expect(screen.getByLabelText("메모 본문")).toHaveFocus();
  });

  test("상태 표시줄에 위치, 줄 수, 글자 수가 보인다", () => {
    render(<MemoPad />);
    typeInto(screen.getByLabelText("메모 본문"), "가 나\n다");

    const status = screen.getByTestId("memo-status");
    expect(status).toHaveTextContent("Ln 2, Col 2, Pos 6");
    expect(status).toHaveTextContent("2줄");
    expect(status).toHaveTextContent("5자");
    expect(status).toHaveTextContent("공백 제외 3");
  });

  test("자동 저장 표시가 보이고, 쓰면 잠깐 저장 중이 되었다가 돌아온다", () => {
    vi.useFakeTimers();
    render(<MemoPad />);
    expect(screen.getByRole("status")).toHaveTextContent("자동 저장됨");

    typeInto(screen.getByLabelText("메모 본문"), "쓰는 중");
    expect(screen.getByRole("status")).toHaveTextContent("저장 중…");

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByRole("status")).toHaveTextContent("자동 저장됨");
    vi.useRealTimers();
  });

  test("쓴 글은 저장 버튼 없이도 다시 열면 남아 있다", () => {
    const { unmount } = render(<MemoPad />);
    typeInto(screen.getByLabelText("메모 본문"), "남아 있어야 한다");
    unmount();

    render(<MemoPad />);
    expect(screen.getByLabelText("메모 본문")).toHaveValue("남아 있어야 한다");
  });

  test("저장 버튼을 누르면 현재 글을 txt 파일로 내려받는다", async () => {
    const createObjectURL = vi.fn((blob: Blob) => {
      lastBlob = blob;
      return "blob:memo";
    });
    let lastBlob: Blob | null = null;
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }));
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        downloadName = this.download;
      });
    let downloadName = "";

    render(<MemoPad />);
    typeInto(screen.getByLabelText("메모 본문"), "백업할 글");
    fireEvent.click(screen.getByRole("button", { name: "파일로 저장" }));

    expect(downloadName).toMatch(/^ritus-memo-\d{8}\.txt$/);
    expect(await lastBlob!.text()).toBe("백업할 글");
    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  test("복사 버튼을 누르면 현재 글이 클립보드에 담기고 잠깐 복사됨으로 바뀐다", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", Object.assign(navigator, { clipboard: { writeText } }));

    render(<MemoPad />);
    typeInto(screen.getByLabelText("메모 본문"), "복사할 글");
    fireEvent.click(screen.getByRole("button", { name: "클립보드로 복사" }));

    expect(writeText).toHaveBeenCalledWith("복사할 글");
    expect(await screen.findByRole("button", { name: "복사됨" })).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});

describe("txt/md 형식", () => {
  test("기본은 txt이고 프리뷰가 없다", () => {
    render(<MemoPad />);
    expect(screen.getByRole("tab", { name: "txt" })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByTestId("memo-preview")).not.toBeInTheDocument();
  });

  test("md를 고르면 마크다운 프리뷰가 그려지고, txt로 돌아가도 본문은 그대로다", () => {
    render(<MemoPad />);
    typeInto(screen.getByLabelText("메모 본문"), "# 제목\n\n- 항목 **굵게**");
    fireEvent.click(screen.getByRole("tab", { name: "md" }));

    const preview = screen.getByTestId("memo-preview");
    expect(preview.querySelector("h1")).toHaveTextContent("제목");
    expect(preview.querySelector("li strong")).toHaveTextContent("굵게");

    fireEvent.click(screen.getByRole("tab", { name: "txt" }));
    expect(screen.queryByTestId("memo-preview")).not.toBeInTheDocument();
    expect(screen.getByLabelText("메모 본문")).toHaveValue("# 제목\n\n- 항목 **굵게**");
  });

  test("고른 형식은 다시 열어도 기억된다", () => {
    const { unmount } = render(<MemoPad />);
    fireEvent.click(screen.getByRole("tab", { name: "md" }));
    unmount();

    render(<MemoPad />);
    expect(screen.getByRole("tab", { name: "md" })).toHaveAttribute("aria-selected", "true");
  });

  test("프리뷰는 본문의 HTML을 실행하지 않는다", () => {
    render(<MemoPad />);
    typeInto(screen.getByLabelText("메모 본문"), '<img src=x onerror="alert(1)"><script>alert(1)</script>');
    fireEvent.click(screen.getByRole("tab", { name: "md" }));

    const preview = screen.getByTestId("memo-preview");
    expect(preview.querySelector("img")).toBeNull();
    expect(preview.querySelector("script")).toBeNull();
  });
});
