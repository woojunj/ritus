import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";

import { ConscienceNote } from "./conscience-note";
import { COPYRIGHT_NOTICE } from "./lib/form";
import { formatNoteDate, todayIso } from "./lib/storage";

beforeEach(() => {
  localStorage.clear();
});

function startNewNote() {
  fireEvent.click(screen.getByRole("button", { name: "새 양심노트 쓰기" }));
}

function backToList() {
  fireEvent.click(screen.getByRole("button", { name: "완료" }));
}

function chartDots() {
  return [...screen.getByRole("img").querySelectorAll("circle[data-virtue]")];
}

describe("양심노트 목록", () => {
  test("쓴 것이 없으면 빈 목록과 새로 쓰기만 보인다", () => {
    render(<ConscienceNote />);
    expect(screen.getByRole("button", { name: "새 양심노트 쓰기" })).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).toBeNull();
  });

  test("새로 쓰기를 누르면 오늘 날짜의 빈 한 장이 열리고 사안에 바로 입력할 수 있다", () => {
    render(<ConscienceNote />);
    startNewNote();

    expect(screen.getByLabelText("날짜")).toHaveValue(todayIso());
    expect(screen.getByLabelText("사안")).toHaveFocus();
    expect(screen.getByLabelText("사안")).toHaveValue("");
  });

  test("목록은 최근 날짜부터 보이고, 날짜와 사안의 첫 줄이 보인다", () => {
    render(<ConscienceNote />);
    startNewNote();
    fireEvent.change(screen.getByLabelText("날짜"), { target: { value: "2026-10-01" } });
    fireEvent.change(screen.getByLabelText("사안"), {
      target: { value: "회의에서 말을 끊었다\n둘째 줄" },
    });
    backToList();
    startNewNote();
    fireEvent.change(screen.getByLabelText("날짜"), { target: { value: "2026-10-05" } });
    backToList();

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("2026년 10월 5일");
    expect(items[1]).toHaveTextContent("2026년 10월 1일");
    expect(items[1]).toHaveTextContent("회의에서 말을 끊었다");
    expect(items[1]).not.toHaveTextContent("둘째 줄");
  });
});

describe("양심노트 목록의 도표와 삭제", () => {
  test("단계를 고른 한 장에만 작은 도표가 보인다", () => {
    render(<ConscienceNote />);
    startNewNote();
    fireEvent.change(screen.getByLabelText("사안"), { target: { value: "단계 없음" } });
    backToList();
    startNewNote();
    fireEvent.change(screen.getByLabelText("사안"), { target: { value: "단계 있음" } });
    fireEvent.click(
      within(screen.getByRole("group", { name: "정의 단계" })).getByRole("button", {
        name: "자명",
      })
    );
    backToList();

    const [withLevel, withoutLevel] = screen.getAllByRole("listitem");
    expect(withLevel).toHaveTextContent("단계 있음");
    expect(within(withLevel).getByTestId("note-chart")).toBeInTheDocument();
    expect(within(withoutLevel).queryByTestId("note-chart")).toBeNull();
  });

  test("목록에서도 확인을 거쳐 그 한 장만 지운다", () => {
    render(<ConscienceNote />);
    startNewNote();
    fireEvent.change(screen.getByLabelText("사안"), { target: { value: "남길 것" } });
    backToList();
    startNewNote();
    fireEvent.change(screen.getByLabelText("사안"), { target: { value: "지울 것" } });
    backToList();

    fireEvent.click(screen.getByRole("button", { name: '"지울 것" 삭제' }));
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveTextContent("이 양심노트를 지울까요?");
    fireEvent.click(within(dialog).getByRole("button", { name: "취소" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: '"지울 것" 삭제' }));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "확인" })
    );
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent("남길 것");
  });
});

describe("양심노트 한 장", () => {
  test("자동 저장 표시가 보이고, 쓰면 잠깐 저장 중이 되며, 완료를 누르면 목록으로 돌아간다", () => {
    render(<ConscienceNote />);
    startNewNote();
    expect(screen.getByRole("status")).toHaveTextContent("자동 저장됨");

    fireEvent.change(screen.getByLabelText("사안"), { target: { value: "쓰는 중" } });
    expect(screen.getByRole("status")).toHaveTextContent("저장 중…");

    backToList();
    expect(screen.getByRole("listitem")).toHaveTextContent("쓰는 중");
  });

  test("사안, 여섯 덕목, 최종 결론이 양식 순서대로 보이고 안내 질문은 원문 그대로다", () => {
    render(<ConscienceNote />);
    startNewNote();

    const labels = ["사안", "몰입", "사랑", "정의", "예절", "성실", "지혜", "최종 결론"];
    const fields = labels.map((label) => screen.getByLabelText(label));
    for (let i = 1; i < fields.length; i++) {
      expect(
        fields[i - 1].compareDocumentPosition(fields[i]) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    }

    expect(screen.getByText("지금 이 순간 깨어있는가?")).toBeInTheDocument();
    expect(screen.getByText("당시에는 깨어있었는가?")).toBeInTheDocument();
    expect(
      screen.getByText("생각과 언행이 겸손하며 상황과 조화를 이루었는가?")
    ).toBeInTheDocument();
    expect(screen.getByText("나의 선택과 판단은 찜찜함 없이 자명한가?")).toBeInTheDocument();
    expect(screen.getByText(COPYRIGHT_NOTICE)).toBeInTheDocument();
  });

  test("덕목의 단계를 고르면 도표에 점이 찍히고, 다시 누르면 해제된다", () => {
    render(<ConscienceNote />);
    startNewNote();
    expect(chartDots()).toHaveLength(0);

    const love = within(screen.getByRole("group", { name: "사랑 단계" }));
    fireEvent.click(love.getByRole("button", { name: "자명" }));
    expect(love.getByRole("button", { name: "자명" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(chartDots()).toHaveLength(1);
    // 사랑은 왼쪽 축이고 자명은 가장 바깥이다.
    expect(chartDots()[0]).toHaveAttribute("cx", "-90");
    expect(chartDots()[0]).toHaveAttribute("cy", "0");

    fireEvent.click(love.getByRole("button", { name: "찜찜" }));
    expect(chartDots()[0]).toHaveAttribute("cx", "0");
    expect(love.getByRole("button", { name: "자명" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );

    fireEvent.click(love.getByRole("button", { name: "찜찜" }));
    expect(chartDots()).toHaveLength(0);
  });

  test("쓴 글과 고른 단계는 다시 열어도 그대로다", () => {
    const { unmount } = render(<ConscienceNote />);
    startNewNote();
    fireEvent.change(screen.getByLabelText("사안"), { target: { value: "약속에 늦었다" } });
    fireEvent.change(screen.getByLabelText("성실"), { target: { value: "미리 나서지 않았다" } });
    fireEvent.change(screen.getByLabelText("최종 결론"), { target: { value: "먼저 사과한다" } });
    fireEvent.click(
      within(screen.getByRole("group", { name: "성실 단계" })).getByRole("button", {
        name: "찜자",
      })
    );
    unmount();

    render(<ConscienceNote />);
    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(formatNoteDate(todayIso())) })
    );
    expect(screen.getByLabelText("사안")).toHaveValue("약속에 늦었다");
    expect(screen.getByLabelText("성실")).toHaveValue("미리 나서지 않았다");
    expect(screen.getByLabelText("최종 결론")).toHaveValue("먼저 사과한다");
    expect(
      within(screen.getByRole("group", { name: "성실 단계" })).getByRole("button", {
        name: "찜자",
      })
    ).toHaveAttribute("aria-pressed", "true");
    expect(chartDots()).toHaveLength(1);
  });

  test("삭제는 먼저 묻고, 확인하면 그 한 장만 목록에서 사라진다", () => {
    render(<ConscienceNote />);
    startNewNote();
    fireEvent.change(screen.getByLabelText("사안"), { target: { value: "남길 것" } });
    backToList();
    startNewNote();
    fireEvent.change(screen.getByLabelText("사안"), { target: { value: "지울 것" } });

    fireEvent.click(screen.getByRole("button", { name: "양심노트 삭제" }));
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveTextContent("이 양심노트를 지울까요?");
    fireEvent.click(within(dialog).getByRole("button", { name: "취소" }));
    expect(screen.getByLabelText("사안")).toHaveValue("지울 것");

    fireEvent.click(screen.getByRole("button", { name: "양심노트 삭제" }));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "확인" })
    );

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent("남길 것");
  });
});
