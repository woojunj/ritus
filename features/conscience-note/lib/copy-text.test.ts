import { describe, expect, test } from "vitest";

import { mergePastedNote, noteToText, parsePastedNotes } from "./copy-text";
import { createNote, todayIso } from "./storage";

describe("붙여넣은 글 읽기", () => {
  test("이 앱에서 복사한 한 장은 날짜, 글, 단계 그대로 돌아온다", () => {
    const note = createNote();
    note.date = "2026-10-11";
    note.matter = "회의에서 말을 끊었다";
    note.virtues.love = { text: "끝까지 듣지 않았다", level: 1 };
    note.conclusion = "먼저 사과한다";

    const [pasted] = parsePastedNotes(noteToText(note));

    expect(noteToText(pasted)).toBe(noteToText(note));
  });

  test("다른 곳에서 쓴 글은 덕목 이름이 적힌 줄을 따라 양식에 나눠 담는다", () => {
    const [note] = parsePastedNotes(
      [
        "2026.10.9",
        "약속에 늦었다",
        "",
        "## 몰입 (자찜)",
        "서두르느라 깨어 있지 못했다",
        "사랑: 기다리는 사람을 생각하지 못했다",
        "사랑하는 친구였는데",
        "**[성실] 찜자**",
        "미리 나서지 않았다",
        "결론",
        "다음에는 10분 일찍 나선다",
      ].join("\r\n")
    );

    expect(note.date).toBe("2026-10-09");
    expect(note.matter).toBe("약속에 늦었다");
    expect(note.virtues.immersion).toEqual({
      text: "서두르느라 깨어 있지 못했다",
      level: 2,
    });
    expect(note.virtues.love).toEqual({
      text: "기다리는 사람을 생각하지 못했다\n사랑하는 친구였는데",
      level: null,
    });
    expect(note.virtues.sincerity).toEqual({ text: "미리 나서지 않았다", level: 1 });
    expect(note.conclusion).toBe("다음에는 10분 일찍 나선다");
  });

  test("구획이 없는 글은 오늘 날짜의 사안으로 들어간다", () => {
    const [note] = parsePastedNotes("오늘 있었던 일\n두 번째 줄");

    expect(note.date).toBe(todayIso());
    expect(note.matter).toBe("오늘 있었던 일\n두 번째 줄");
  });

  test("빈 글은 아무것도 만들지 않는다", () => {
    expect(parsePastedNotes(" \n\n")).toEqual([]);
  });
});

describe("열려 있는 한 장에 붙여넣기", () => {
  test("빈 칸은 채우고 글이 있는 칸에는 아래에 이어 붙인다", () => {
    const note = createNote();
    note.date = "2026-10-01";
    note.matter = "회의에서 말을 끊었다";
    note.virtues.love = { text: "", level: 3 };

    const [pasted] = parsePastedNotes(
      "2026.10.9\n상대가 말을 멈췄다\n사랑 (찜찜)\n끝까지 듣지 않았다\n정의 (찜자)\n결론: 먼저 사과한다"
    );
    const merged = mergePastedNote(note, pasted);

    expect(merged?.matter).toBe("회의에서 말을 끊었다\n\n상대가 말을 멈췄다");
    expect(merged?.virtues.love).toEqual({ text: "끝까지 듣지 않았다", level: 3 });
    expect(merged?.virtues.justice).toEqual({ text: "", level: 1 });
    expect(merged?.conclusion).toBe("먼저 사과한다");
    expect(merged?.date).toBe("2026-10-01");
    expect(merged?.id).toBe(note.id);
  });

  test("더할 것이 없으면 null을 돌려준다", () => {
    expect(mergePastedNote(createNote(), createNote())).toBeNull();
  });
});
