import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";

import { MemoPad } from "./memo-pad";

import { DEFAULT_SOURCE } from "./lib/transcription-storage";

beforeEach(() => localStorage.clear());
const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
const write = (name: string, value: string) => fireEvent.change(screen.getByLabelText(name), { target: { value } });

test("일반 메모와 필사 원문·본문을 별도로 저장하고 다시 연다", () => {
  const { unmount } = render(<MemoPad />);
  write("메모 본문", "일반 메모");
  click("필사");
  click("원문 편집");
  write("원문 편집", "내 원문");
  click("편집 마치기");
  write("필사 본문", "필사한 글");
  click("일반");
  expect(screen.getByLabelText("메모 본문")).toHaveValue("일반 메모");
  unmount();
  render(<MemoPad />);
  click("필사");
  expect(screen.getByLabelText("필사 원문")).toHaveTextContent("내 원문");
  expect(screen.getByLabelText("필사 본문")).toHaveValue("필사한 글");
});

test("복원 취소는 원문을 보존하고 확인은 원문만 복원한다", () => {
  render(<MemoPad />);
  click("필사");
  click("원문 편집");
  write("원문 편집", "편집한 원문");
  write("필사 본문", "남겨야 할 글");
  click("기본 원문 복원");
  fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "취소" }));
  expect(screen.getByLabelText("원문 편집")).toHaveValue("편집한 원문");
  click("기본 원문 복원");
  fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "복원" }));
  expect(screen.getByLabelText("원문 편집")).toHaveValue(DEFAULT_SOURCE);
  expect(screen.getByLabelText("필사 본문")).toHaveValue("남겨야 할 글");
});


test("첫 필사 화면에 제공받은 전문과 출처가 표시된다", () => {
  render(<MemoPad />);
  click("필사");
  const source = screen.getByLabelText("필사 원문");
  expect(source).toHaveTextContent("깨어있는 마음을 챙기는 요결");
  expect(source).toHaveTextContent("(양심의 진리인 구공具空의 진리)");
  expect(source).toHaveTextContent("우리 삶의 알파와 오메가이다.");
  expect(screen.getByRole("link", { name: /출처/ })).toHaveAttribute("href", "https://cafe.naver.com/bohd/77645");
  expect(screen.getByLabelText("필사 본문")).toHaveValue("");
});
