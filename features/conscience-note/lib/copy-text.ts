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

/** 한 장을 양식 순서대로 읽히는 일반 텍스트로 만든다. 고른 단계는 덕목 이름 옆에 붙는다. */
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
