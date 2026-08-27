import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import Home from "@/app/page";

test("홈 화면은 집중 세션 타이머 설정 화면을 보여준다", () => {
  render(<Home />);

  expect(screen.getByLabelText("세션 제목")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "시작" })).toBeInTheDocument();
});
