import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { IntervalSettings } from "./interval-settings";

function renderSettings(overrides: Partial<Parameters<typeof IntervalSettings>[0]> = {}) {
  return render(
    <IntervalSettings
      enabled={false}
      onToggleEnabled={() => {}}
      plan={{ first: 60, second: 60 }}
      onPlanChange={() => {}}
      totalSeconds={1500}
      {...overrides}
    />
  );
}

describe("번갈아 반복 토글", () => {
  test("1, 2 배지와 화살표가 보이고, 글자는 스크린리더에서만 읽힌다", () => {
    renderSettings();

    const button = screen.getByRole("button", { name: "번갈아 반복" });
    expect(button).toHaveTextContent("1");
    expect(button).toHaveTextContent("2");
    expect(button.querySelector("svg")).toBeInTheDocument();
    expect(button.querySelector(".sr-only")).toHaveTextContent("번갈아 반복");
  });

  test("꺼짐/켜짐 상태가 aria-pressed로 드러난다", () => {
    renderSettings({ enabled: true });

    expect(screen.getByRole("button", { name: "번갈아 반복" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });
});

describe("구간 필드 라벨", () => {
  test("첫 구간과 두 번째 구간은 숫자 배지로 구분되고, 전체 문구는 스크린리더 전용이다", () => {
    renderSettings({ enabled: true });

    const firstDial = screen.getByLabelText("첫 구간 다이얼");
    const secondDial = screen.getByLabelText("두 번째 구간 다이얼");

    const firstField = firstDial.closest("[data-order]");
    const secondField = secondDial.closest("[data-order]");

    expect(firstField).toHaveAttribute("data-order", "first");
    expect(secondField).toHaveAttribute("data-order", "second");
    expect(firstField?.querySelector(".sr-only")).toHaveTextContent("첫 구간");
    expect(secondField?.querySelector(".sr-only")).toHaveTextContent(
      "두 번째 구간"
    );
  });
});

describe("구간 다이얼 초 표시", () => {
  test("각 다이얼 위에 지금 값과 초 단위가 함께 보인다", () => {
    renderSettings({ enabled: true, plan: { first: 45, second: 90 } });

    expect(screen.getByText("45")).toBeInTheDocument();
    expect(screen.getByText("90")).toBeInTheDocument();
    expect(screen.getAllByText("초")).toHaveLength(2);
  });
});
