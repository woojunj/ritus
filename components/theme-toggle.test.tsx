import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "next-themes";
import { beforeEach, expect, test } from "vitest";

import { ThemeToggle } from "./theme-toggle";

beforeEach(() => {
  localStorage.clear();
  // jsdom에는 matchMedia가 없어 next-themes가 시스템 테마를 읽지 못한다.
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});

test("누를 때마다 라이트 → 다크 → 시스템 순서로 바뀌고 지금 테마를 읽어 준다", () => {
  render(
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ThemeToggle />
    </ThemeProvider>
  );

  const button = screen.getByRole("button", { name: /테마 선택/ });
  expect(button).toHaveAccessibleName("테마 선택: 시스템 설정 따르기");

  fireEvent.click(button);
  expect(button).toHaveAccessibleName("테마 선택: 라이트 모드");
  expect(document.documentElement).toHaveClass("light");

  fireEvent.click(button);
  expect(button).toHaveAccessibleName("테마 선택: 다크 모드");
  expect(document.documentElement).toHaveClass("dark");

  fireEvent.click(button);
  expect(button).toHaveAccessibleName("테마 선택: 시스템 설정 따르기");
});
