import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { RunningScreen } from "./running-screen";

function renderScreen(overrides: Partial<Parameters<typeof RunningScreen>[0]> = {}) {
  return render(
    <RunningScreen
      title="결제 모듈 리팩터링"
      remainingSeconds={30}
      totalSeconds={60}
      phase="running"
      onTogglePause={() => {}}
      onQuit={() => {}}
      {...overrides}
    />
  );
}

describe("진행 화면의 원형 진행 링", () => {
  test("남은 시간 비율만큼만 링이 채워진다", () => {
    renderScreen({ remainingSeconds: 30, totalSeconds: 60 });

    const ring = screen.getByTestId("progress-ring-value");
    const circumference = Number(ring.getAttribute("data-circumference"));
    const offset = Number(ring.getAttribute("stroke-dashoffset"));

    expect(offset).toBeCloseTo(circumference * 0.5, 1);
  });

  test("시간이 다 되면 링이 완전히 빈다", () => {
    renderScreen({ remainingSeconds: 0, totalSeconds: 60 });

    const ring = screen.getByTestId("progress-ring-value");
    const circumference = Number(ring.getAttribute("data-circumference"));
    const offset = Number(ring.getAttribute("stroke-dashoffset"));

    expect(offset).toBeCloseTo(circumference, 1);
  });
});

describe("숫자 가리기", () => {
  test("기본값은 숫자가 링 아래에 보인다", () => {
    renderScreen({ remainingSeconds: 30 });

    expect(screen.getByRole("timer")).toHaveTextContent("00:30");
  });

  test("가리기를 누르면 숫자가 사라지고, 다시 누르면 보인다", () => {
    renderScreen({ remainingSeconds: 30 });

    fireEvent.click(screen.getByRole("button", { name: "숫자 가리기" }));
    expect(screen.queryByRole("timer")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "숫자 보이기" }));
    expect(screen.getByRole("timer")).toHaveTextContent("00:30");
  });
});

describe("동작 버튼 아이콘", () => {
  test("실행 중에는 일시정지 아이콘, 멈춘 뒤에는 재생 아이콘이 보이고 글자는 스크린리더 전용이다", () => {
    const { rerender } = renderScreen({ phase: "running" });

    const runningButton = screen.getByRole("button", { name: "일시정지" });
    expect(runningButton.querySelector("svg")).toBeInTheDocument();
    expect(runningButton.querySelector(".sr-only")).toHaveTextContent("일시정지");

    rerender(
      <RunningScreen
        title="결제 모듈 리팩터링"
        remainingSeconds={30}
        totalSeconds={60}
        phase="paused"
        onTogglePause={() => {}}
        onQuit={() => {}}
      />
    );

    const pausedButton = screen.getByRole("button", { name: "이어서" });
    expect(pausedButton.querySelector("svg")).toBeInTheDocument();
    expect(pausedButton.querySelector(".sr-only")).toHaveTextContent("이어서");
  });

  test("그만두기 버튼은 정지 아이콘만 보이고 글자는 스크린리더 전용이다", () => {
    renderScreen();

    const button = screen.getByRole("button", { name: "그만두기" });
    expect(button.querySelector("svg")).toBeInTheDocument();
    expect(button.querySelector(".sr-only")).toHaveTextContent("그만두기");
  });
});

describe("구간 표시", () => {
  test("slice가 없으면 구간 표시가 보이지 않는다", () => {
    renderScreen();

    expect(screen.queryByTestId("slice-indicator")).toBeNull();
  });

  test("slice가 있으면 숫자·색 구분과 구간의 남은 시간이 보이고, 전체 문구는 스크린리더 전용이다", () => {
    renderScreen({ slice: { kind: "first", remainingSeconds: 45 } });

    const indicator = screen.getByTestId("slice-indicator");
    expect(indicator).toHaveAttribute("data-slice", "first");
    expect(indicator).toHaveTextContent("00:45");
    expect(indicator.querySelector(".sr-only")).toHaveTextContent("구간 1");
  });

  test("두 번째 구간이면 data-slice가 second다", () => {
    renderScreen({ slice: { kind: "second", remainingSeconds: 12 } });

    const indicator = screen.getByTestId("slice-indicator");
    expect(indicator).toHaveAttribute("data-slice", "second");
    expect(indicator.querySelector(".sr-only")).toHaveTextContent("구간 2");
  });
});
