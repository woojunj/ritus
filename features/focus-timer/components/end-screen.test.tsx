import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { EndScreen } from "./end-screen";

function renderScreen(overrides: Partial<Parameters<typeof EndScreen>[0]> = {}) {
  return render(
    <EndScreen
      title="결제 모듈 리팩터링"
      encouragement="잘 마치셨습니다"
      blinking={false}
      onDismissBlink={() => {}}
      onRestart={() => {}}
      onNewSetup={() => {}}
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

describe("새로 정하기 버튼", () => {
  test("슬라이더 아이콘만 보이고, 글자는 스크린리더에서만 읽힌다", () => {
    renderScreen();

    const button = screen.getByRole("button", { name: "새로 정하기" });
    expect(button.querySelector("svg")).toBeInTheDocument();
    expect(button.querySelector(".sr-only")).toHaveTextContent("새로 정하기");
  });

  test("누르면 설정으로 돌아가는 동작을 부르고, 깜빡임은 건드리지 않는다", () => {
    const calls: string[] = [];
    renderScreen({
      onNewSetup: () => calls.push("setup"),
      onDismissBlink: () => calls.push("blink"),
    });

    fireEvent.click(screen.getByRole("button", { name: "새로 정하기" }));

    expect(calls).toEqual(["setup"]);
  });
});
