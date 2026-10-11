import { LEVELS, VIRTUES } from "./form";
import { formatNoteDate, type ConscienceNoteItem } from "./storage";

/** 한 장을 양식 순서대로 읽히는 일반 텍스트로 만든다. 고른 단계는 덕목 이름 옆에 붙는다. */
export function noteToText(note: ConscienceNoteItem): string {
  const sections = [
    `양심노트 ${formatNoteDate(note.date)}`,
    `[사안]\n${note.matter.trim()}`,
    ...VIRTUES.map((virtue) => {
      const { text, level } = note.virtues[virtue.key];
      const heading =
        level === null ? `[${virtue.name}]` : `[${virtue.name}] ${LEVELS[level]}`;
      return `${heading}\n${text.trim()}`;
    }),
    `[최종 결론]\n${note.conclusion.trim()}`,
  ];
  return sections.map((section) => section.trimEnd()).join("\n\n");
}
