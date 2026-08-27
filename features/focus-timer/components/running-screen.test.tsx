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
