import { fireEvent, render, screen, within } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { playChime } from "./lib/chime";
import { FocusTimer } from "./focus-timer";

vi.mock("./lib/chime", () => ({
  playChime: vi.fn(),
}));

const playChimeMock = vi.mocked(playChime);

function startSession({ title }: { title?: string } = {}) {
  if (title) {
    fireEvent.change(screen.getByLabelText("세션 제목"), {
      target: { value: title },
    });
  }
  fireEvent.click(screen.getByRole("button", { name: "시작" }));
}

beforeEach(() => {
  vi.useFakeTimers();
  playChimeMock.mockClear();
});

afterEach(() => {
  act(() => {
    vi.runOnlyPendingTimers();
  });
  vi.useRealTimers();
  document.title = "";
});

describe("설정 화면", () => {
  test("처음 화면은 25분이 기본값이고 바로 시작할 수 있다", () => {
    render(<FocusTimer />);

    expect(screen.getByRole("button", { name: "시작" })).toBeEnabled();
    expect(screen.getByLabelText("시간(분)")).toHaveValue(25);
  });

  test("제목을 비운 채로도 시작할 수 있다", () => {
    render(<FocusTimer />);

    startSession();

    expect(screen.getByRole("timer")).toBeInTheDocument();
  });

  test("숫자 입력은 1분 미만, 60분 초과를 허용하지 않는다", () => {
    render(<FocusTimer />);

    const minutesInput = screen.getByLabelText("시간(분)");
    fireEvent.change(minutesInput, { target: { value: "0" } });
    fireEvent.blur(minutesInput);
    expect(minutesInput).toHaveValue(1);

    fireEvent.change(minutesInput, { target: { value: "100" } });
    fireEvent.blur(minutesInput);
    expect(minutesInput).toHaveValue(60);
  });
});

describe("세션 진행", () => {
  test("제목을 적고 시작하면 세션 내내 그 문장이 화면에 보인다", () => {
    render(<FocusTimer />);

    startSession({ title: "결제 모듈 리팩터링" });

    expect(screen.getByText("결제 모듈 리팩터링")).toBeInTheDocument();
  });

  test("시작하면 시작 소리가 한 번 울린다", () => {
    render(<FocusTimer />);

    startSession();

    expect(playChimeMock).toHaveBeenCalledTimes(1);
    expect(playChimeMock).toHaveBeenCalledWith(
      "start",
      expect.objectContaining({ muted: false })
    );
  });

  test("세션이 도는 동안 문서 제목이 남은 시간과 제목으로 갱신된다", () => {
    render(<FocusTimer />);

    startSession({ title: "결제 모듈 리팩터링" });

    act(() => {
      vi.advanceTimersByTime(47_000);
    });

    expect(document.title).toBe("24:13 · 결제 모듈 리팩터링");
  });

  test("일시정지하면 남은 시간이 멈추고, 다시 누르면 이어진다", () => {
    render(<FocusTimer />);

    startSession({ title: "결제 모듈 리팩터링" });

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    fireEvent.click(screen.getByRole("button", { name: "일시정지" }));
    const pausedTitle = document.title;

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(document.title).toBe(pausedTitle);

    fireEvent.click(screen.getByRole("button", { name: "이어서" }));
    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(document.title).not.toBe(pausedTitle);
  });

  test("세션 도중 그만두면 메시지나 깜빡임 없이 처음 화면으로 돌아간다", () => {
    render(<FocusTimer />);

    startSession({ title: "결제 모듈 리팩터링" });
    fireEvent.click(screen.getByRole("button", { name: "그만두기" }));

    expect(screen.getByRole("button", { name: "시작" })).toBeInTheDocument();
    expect(screen.queryByText(/고생했다|수고했다|잘 했다/)).toBeNull();
  });
});

describe("세션 종료", () => {
  test("남은 시간이 0이 되면 소리·깜빡임·격려 메시지가 함께 뜬다", () => {
    render(<FocusTimer />);

    const minutesInput = screen.getByLabelText("시간(분)");
    fireEvent.change(minutesInput, { target: { value: "1" } });
    fireEvent.blur(minutesInput);
    startSession();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    const endScreen = screen.getByTestId("end-screen");
    expect(playChimeMock).toHaveBeenCalledWith(
      "end",
      expect.objectContaining({ muted: false })
    );
    expect(endScreen).toHaveAttribute("data-blinking", "true");
    expect(
      within(endScreen).getByText(/고생했다|수고했다|잘 했다|오늘도 해냈다|충분히 잘하고 있다/)
    ).toBeInTheDocument();
  });

  test("종료 화면을 누르면 깜빡임이 멈춘다", () => {
    render(<FocusTimer />);

    const minutesInput = screen.getByLabelText("시간(분)");
    fireEvent.change(minutesInput, { target: { value: "1" } });
    fireEvent.blur(minutesInput);
    startSession();
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    fireEvent.click(screen.getByTestId("end-screen"));

    expect(screen.getByTestId("end-screen")).toHaveAttribute(
      "data-blinking",
      "false"
    );
  });

  test("종료 화면에서 같은 제목·시간으로 다시 시작할 수 있다", () => {
    render(<FocusTimer />);

    const minutesInput = screen.getByLabelText("시간(분)");
    fireEvent.change(minutesInput, { target: { value: "1" } });
    fireEvent.blur(minutesInput);
    startSession({ title: "결제 모듈 리팩터링" });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    fireEvent.click(screen.getByRole("button", { name: "다시 시작" }));

    expect(screen.getByRole("timer")).toBeInTheDocument();
    expect(screen.getByText("결제 모듈 리팩터링")).toBeInTheDocument();
  });
});

describe("전반", () => {
  test("소리를 끄면 시작·종료 소리가 울리지 않는다", () => {
    render(<FocusTimer />);

    fireEvent.click(screen.getByRole("button", { name: "소리 끄기" }));

    const minutesInput = screen.getByLabelText("시간(분)");
    fireEvent.change(minutesInput, { target: { value: "1" } });
    fireEvent.blur(minutesInput);
    startSession();

    expect(playChimeMock).toHaveBeenCalledWith(
      "start",
      expect.objectContaining({ muted: true })
    );

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(playChimeMock).toHaveBeenCalledWith(
      "end",
      expect.objectContaining({ muted: true })
    );
  });

  test("새로고침에 해당하는 재마운트는 세션 기록 없이 처음 화면이다", () => {
    const { unmount } = render(<FocusTimer />);
    startSession({ title: "결제 모듈 리팩터링" });
    unmount();

    render(<FocusTimer />);

    expect(screen.getByRole("button", { name: "시작" })).toBeInTheDocument();
    expect(screen.queryByText("결제 모듈 리팩터링")).toBeNull();
  });
});
