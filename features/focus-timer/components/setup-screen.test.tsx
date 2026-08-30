import { render, screen, within } from "@testing-library/react";
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

describe("번갈아 반복을 켰을 때의 화면 폭별 배치", () => {
  test("좁은 화면 자리와 넓은 화면 자리 양쪽에 반복 설정이 나타난다", () => {
    renderScreen({ intervalEnabled: true });

    const narrowSlot = screen.getByTestId("interval-fields-narrow");
    const wideSlot = screen.getByTestId("interval-fields-wide");

    expect(within(narrowSlot).getByTestId("interval-summary")).toBeInTheDocument();
    expect(within(wideSlot).getByTestId("interval-summary")).toBeInTheDocument();
  });

  test("좁은 화면 자리는 lg 이상에서 숨겨지고, 넓은 화면 자리는 그 미만에서 숨겨진다", () => {
    renderScreen({ intervalEnabled: true });

    expect(screen.getByTestId("interval-fields-narrow")).toHaveClass("lg:hidden");
    expect(screen.getByTestId("interval-fields-wide")).toHaveClass(
      "hidden",
      "lg:flex"
    );
  });

  test("번갈아 반복이 꺼져 있으면 두 자리 모두 나타나지 않는다", () => {
    renderScreen({ intervalEnabled: false });

    expect(screen.queryByTestId("interval-fields-narrow")).not.toBeInTheDocument();
    expect(screen.queryByTestId("interval-fields-wide")).not.toBeInTheDocument();
  });
});
