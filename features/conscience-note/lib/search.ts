import { containsAllTerms } from "@/lib/search";

import { VIRTUES } from "./form";
import type { ConscienceNoteItem } from "./storage";

export { searchTerms } from "@/lib/search";

// 검색 대상 칸과 그 이름. 사안, 여섯 덕목의 답, 최종 결론이다.
function fields(note: ConscienceNoteItem): { label: string; text: string }[] {
  return [
    { label: "사안", text: note.matter },
    ...VIRTUES.map((virtue) => ({ label: virtue.name, text: note.virtues[virtue.key].text })),
    { label: "최종 결론", text: note.conclusion },
  ];
}

/** 낱말이 모두 장 안 어딘가에 들어 있으면 일치한다. 낱말이 없으면 모든 장이 일치한다. */
export function noteMatches(note: ConscienceNoteItem, terms: string[]): boolean {
  const text = fields(note)
    .map((field) => field.text)
    .join("\n");
  return containsAllTerms(text, terms);
}

/** 낱말 가운데 하나라도 든 칸의 이름. 카드에 "사안, 몰입"처럼 보여 준다. */
export function matchedFieldLabels(note: ConscienceNoteItem, terms: string[]): string[] {
  if (terms.length === 0) return [];
  return fields(note)
    .filter((field) => {
      const text = field.text.toLowerCase();
      return terms.some((term) => text.includes(term.toLowerCase()));
    })
    .map((field) => field.label);
}

/**
 * 켠 신호 가운데 하나라도 어느 덕목 칸에서든 고른 장이면 일치한다.
 * 켠 신호가 없으면 모든 장이 일치한다.
 */
export function matchesSignals(note: ConscienceNoteItem, signals: number[]): boolean {
  if (signals.length === 0) return true;
  return VIRTUES.some((virtue) => {
    const level = note.virtues[virtue.key].level;
    return level !== null && signals.includes(level);
  });
}
