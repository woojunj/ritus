import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { EndScreen } from "./end-screen";

function renderScreen(overrides: Partial<Parameters<typeof EndScreen>[0]> = {}) {
  return render(
    <EndScreen
      title="결제 모듈 리팩터링"
      encouragement="오늘도 해냈다"
      blinking={false}
      onDismissBlink={() => {}}
      onRestart={() => {}}
      {...overrides}
    />
  );
}

describe("다시 시작 버튼", () => {
  test("되돌리기 아이콘만 보이고, 글자는 스크린리더에서만 읽힌다", () => {
    renderScreen();

    const button = screen.getByRole("button", { name: "다시 시작" });
    expect(button.querySelector("svg")).toBeInTheDocument();
    expect(button.querySelector(".sr-only")).toHaveTextContent("다시 시작");
  });
});
