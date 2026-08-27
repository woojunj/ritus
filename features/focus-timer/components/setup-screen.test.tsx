import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { SetupScreen } from "./setup-screen";

function renderScreen(overrides: Partial<Parameters<typeof SetupScreen>[0]> = {}) {
  return render(
    <SetupScreen
      title=""
      minutes={25}
      onTitleChange={() => {}}
      onMinutesChange={() => {}}
      intervalEnabled={false}
      onToggleIntervalEnabled={() => {}}
      intervalPlan={{ first: 60, second: 60 }}
      onIntervalPlanChange={() => {}}
      onStart={() => {}}
      {...overrides}
    />
  );
}

describe("시작 버튼", () => {
  test("재생 아이콘만 보이고, 글자는 스크린리더에서만 읽힌다", () => {
    renderScreen();

    const button = screen.getByRole("button", { name: "시작" });
    expect(button.querySelector("svg")).toBeInTheDocument();
    expect(button.querySelector(".sr-only")).toHaveTextContent("시작");
  });
});
