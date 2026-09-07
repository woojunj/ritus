import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import TodosPage from "@/app/todos/page";

test("할 일 목록 화면을 보여준다", () => {
  render(<TodosPage />);

  expect(screen.getByLabelText("새 할 일")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "할 일 추가" })).toBeInTheDocument();
  expect(screen.getByLabelText("타이머로 돌아가기")).toBeInTheDocument();
});
