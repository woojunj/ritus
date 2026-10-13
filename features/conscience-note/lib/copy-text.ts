import { dateStamp, type TextFile } from "@/lib/download";

import { LEVELS, VIRTUES, type VirtueKey } from "./form";
import {
  createNote,
  formatNoteDate,
  sortNotes,
  type ConscienceNoteItem,
} from "./storage";

const TITLE = "양심노트";
const MATTER = "사안";
const CONCLUSION = "최종 결론";

/** 한 장을 양식 순서대로 읽히는 일반 텍스트로 만든다. 고른 신호는 덕목 이름 옆에 붙는다. */
export function noteToText(note: ConscienceNoteItem): string {
  const sections = [
    `${TITLE} ${formatNoteDate(note.date)}`,
    `[${MATTER}]\n${note.matter.trim()}`,
    ...VIRTUES.map((virtue) => {
      const { text, level } = note.virtues[virtue.key];
      const heading =
        level === null ? `[${virtue.name}]` : `[${virtue.name}] ${LEVELS[level]}`;
      return `${heading}\n${text.trim()}`;
    }),
    `[${CONCLUSION}]\n${note.conclusion.trim()}`,
  ];
  return sections.map((section) => section.trimEnd()).join("\n\n");
}

/**
 * 도우미에게 건넬 글. 부탁하는 말 아래에 오늘 날짜의 빈 양식이 붙는다. 쓴 글은 들어가지 않는다.
 * withSignals면 신호도 판단해 달라는 부탁을 더한다.
 */
export function helperRequest(withSignals: boolean): string {
  const lines = [
    "아래 양식에 맞춰 정리해 주세요. 대괄호로 된 제목 줄은 그대로 두고, 그 아래에 글을 적어 주세요.",
    // 내용만 남으면 나중에 어떤 질문에 답한 것인지 알기 어렵다.
    "우리가 나눈 대화에서 질문에 답한 내용을 적을 때는 그 앞에 어떤 질문이었는지 짧게 적어 주세요. 예: Q. 무엇이 두려웠나요?",
  ];
  if (withSignals) {
    lines.push(
      `덕목마다 ${LEVELS.join(", ")} 중 하나를 판단해서 제목 줄의 대괄호 뒤에 적어 주세요. 예: [덕목 이름] ${LEVELS[LEVELS.length - 1]}`
    );
  }
  return `${lines.join("\n")}\n\n${noteToText(createNote())}`;
}

/** 한 장을 내려받을 파일. 이름에는 그 한 장의 날짜가 들어간다. */
export function noteFile(note: ConscienceNoteItem): TextFile {
  return {
    name: `ritus-conscience-${note.date.replaceAll("-", "")}.txt`,
    text: noteToText(note),
    type: "text/plain",
  };
}

/** 모든 한 장을 목록 순서대로 이어 붙인 파일. */
export function allNotesFile(notes: ConscienceNoteItem[]): TextFile {
  return {
    name: `ritus-conscience-all-${dateStamp()}.txt`,
    text: sortNotes(notes).map(noteToText).join("\n\n\n"),
    type: "text/plain",
  };
}

const TITLE_LINE = /^양심노트 (\d+)년 (\d+)월 (\d+)일$/;
const HEADING_NAMES = [MATTER, ...VIRTUES.map((virtue) => virtue.name), CONCLUSION];
const HEADING_LINE = new RegExp(
  `^\\[(${HEADING_NAMES.join("|")})\\](?: (${LEVELS.join("|")}))?$`
);

/**
 * noteToText가 만든 글을 다시 한 장들로 읽는다. 한 장만 든 파일과 여러 장을
 * 이어 붙인 파일을 모두 읽고, 양식에 맞지 않는 글은 건너뛴다.
 */
export function parseNotes(text: string): ConscienceNoteItem[] {
  const notes: ConscienceNoteItem[] = [];
  const now = Date.now();
  let note: ConscienceNoteItem | null = null;
  let section: string | null = null;
  let level: number | null = null;
  let lines: string[] = [];

  const closeSection = () => {
    if (!note || !section) return;
    const body = lines.join("\n").trim();
    const virtue = VIRTUES.find((item) => item.name === section);
    if (section === MATTER) note.matter = body;
    else if (section === CONCLUSION) note.conclusion = body;
    else if (virtue) note.virtues[virtue.key as VirtueKey] = { text: body, level };
    section = null;
  };

  for (const line of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const title = line.match(TITLE_LINE);
    const heading = line.match(HEADING_LINE);
    if (title) {
      closeSection();
      const [, year, month, day] = title;
      note = {
        ...createNote(),
        date: `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
        // 파일에 적힌 순서가 같은 날짜 안에서도 그대로 남게 한다.
        createdAt: now - notes.length,
      };
      notes.push(note);
    } else if (note && heading) {
      closeSection();
      section = heading[1];
      level = heading[2] ? LEVELS.indexOf(heading[2] as (typeof LEVELS)[number]) : null;
      lines = [];
    } else if (section) {
      lines.push(line);
    }
  }
  closeSection();
  return notes;
}

const LOOSE_NAMES: Record<string, string> = {
  ...Object.fromEntries(HEADING_NAMES.map((name) => [name, name])),
  최종결론: CONCLUSION,
  결론: CONCLUSION,
};
// "[몰입] 자명" 말고도 "몰입", "## 몰입 (자명)", "1. 몰입: 깨어 있었다"처럼 적은 줄을 받는다.
// 괄호나 쌍점 없이 뒤에 다른 글이 이어지는 줄("사랑하는 사람")은 구획으로 보지 않는다.
const LOOSE_HEADING_LINE = new RegExp(
  `^[\\s#>*\\-\\d.)]*\\[?\\s*(${Object.keys(LOOSE_NAMES).join("|")})\\s*\\]?\\**\\s*` +
    `(?:[(\\-:：]?\\s*(${LEVELS.join("|")})\\s*\\)?)?\\**\\s*(?:[:：]\\s*(.*))?$`
);
const LOOSE_DATE_LINE =
  /^(?:양심노트|날짜)?\s*[:：]?\s*(\d{4})\s*[-./년]\s*(\d{1,2})\s*[-./월]\s*(\d{1,2})\s*일?\.?$/;

/**
 * 붙여넣은 글을 한 장들로 읽는다. 이 앱에서 복사한 글은 parseNotes와 똑같이 읽고,
 * 다른 곳에서 쓴 글은 덕목 이름이 적힌 줄을 찾아 양식에 나눠 담는다. 구획 앞의 글과
 * 구획이 하나도 없는 글은 사안으로 들어간다.
 */
export function parsePastedNotes(text: string): ConscienceNoteItem[] {
  const allLines = text.replace(/^﻿/, "").split(/\r?\n/);
  if (allLines.every((line) => !line.trim())) return [];
  if (allLines.some((line) => TITLE_LINE.test(line))) return parseNotes(text);

  const note = createNote();
  let section: string = MATTER;
  let level: number | null = null;
  let lines: string[] = [];
  let sawHeading = false;

  const closeSection = () => {
    const body = lines.join("\n").trim();
    const virtue = VIRTUES.find((item) => item.name === section);
    if (section === MATTER) {
      if (body) note.matter = note.matter ? `${note.matter}\n\n${body}` : body;
    } else if (section === CONCLUSION) note.conclusion = body;
    else if (virtue) note.virtues[virtue.key as VirtueKey] = { text: body, level };
  };

  for (const line of allLines) {
    const heading = line.match(LOOSE_HEADING_LINE);
    const date = sawHeading
      ? null
      : line.replace(/^[\s#>*]+|[\s*]+$/g, "").match(LOOSE_DATE_LINE);
    if (heading) {
      closeSection();
      sawHeading = true;
      section = LOOSE_NAMES[heading[1]];
      level = heading[2] ? LEVELS.indexOf(heading[2] as (typeof LEVELS)[number]) : null;
      lines = heading[3] ? [heading[3]] : [];
    } else if (date && +date[2] >= 1 && +date[2] <= 12 && +date[3] >= 1 && +date[3] <= 31) {
      note.date = `${date[1]}-${date[2].padStart(2, "0")}-${date[3].padStart(2, "0")}`;
    } else {
      lines.push(line);
    }
  }
  closeSection();
  return [note];
}

// 이미 쓴 글은 그대로 두고, 한 줄 띄운 뒤 붙여넣은 글을 잇는다.
function appendText(existing: string, incoming: string): string {
  if (!incoming) return existing;
  return existing.trim() ? `${existing.trimEnd()}\n\n${incoming}` : incoming;
}

/**
 * 붙여넣은 한 장을 열려 있는 한 장에 더한다. 빈 칸은 채우고 글이 있는 칸에는 아래에
 * 이어 붙인다. 이미 고른 신호와 한 장의 날짜는 그대로 둔다. 더할 것이 없으면 null.
 */
export function mergePastedNote(
  note: ConscienceNoteItem,
  pasted: ConscienceNoteItem
): ConscienceNoteItem | null {
  const merged: ConscienceNoteItem = {
    ...note,
    matter: appendText(note.matter, pasted.matter),
    virtues: Object.fromEntries(
      VIRTUES.map((virtue) => {
        const mine = note.virtues[virtue.key];
        const theirs = pasted.virtues[virtue.key];
        return [
          virtue.key,
          {
            text: appendText(mine.text, theirs.text),
            level: mine.level ?? theirs.level,
          },
        ];
      })
    ) as ConscienceNoteItem["virtues"],
    conclusion: appendText(note.conclusion, pasted.conclusion),
  };
  return noteToText(merged) === noteToText(note) ? null : merged;
}

/** 이미 같은 내용의 한 장이 있으면 빼고, 새로 들어올 것만 돌려준다. */
export function newNotesOnly(
  incoming: ConscienceNoteItem[],
  existing: ConscienceNoteItem[]
): ConscienceNoteItem[] {
  const seen = new Set(existing.map(noteToText));
  return incoming.filter((note) => {
    const key = noteToText(note);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
