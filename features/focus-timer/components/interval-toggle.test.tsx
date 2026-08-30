import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { IntervalToggle } from "./interval-toggle";

function renderToggle(overrides: Partial<Parameters<typeof IntervalToggle>[0]> = {}) {
  return render(
    <IntervalToggle enabled={false} onToggleEnabled={() => {}} {...overrides} />
  );
}

describe("번갈아 반복 토글", () => {
  test("1, 2 배지와 화살표가 보이고, 글자는 스크린리더에서만 읽힌다", () => {
    renderToggle();

    const button = screen.getByRole("button", { name: "번갈아 반복" });
    expect(button).toHaveTextContent("1");
    expect(button).toHaveTextContent("2");
    expect(button.querySelector("svg")).toBeInTheDocument();
    expect(button.querySelector(".sr-only")).toHaveTextContent("번갈아 반복");
  });

  test("꺼짐/켜짐 상태가 aria-pressed로 드러난다", () => {
    renderToggle({ enabled: true });

    expect(screen.getByRole("button", { name: "번갈아 반복" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });
});
