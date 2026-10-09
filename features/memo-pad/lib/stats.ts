// 글자는 화면에 보이는 단위(grapheme)로 센다. 한글 한 글자, 이모지 하나가 각각 1자다.
const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

function graphemeLength(text: string): number {
  return Array.from(segmenter.segment(text)).length;
}

export function cursorPosition(
  text: string,
  offset: number
): { line: number; column: number; position: number } {
  const before = text.slice(0, offset);
  const lines = before.split("\n");
  return {
    line: lines.length,
    column: graphemeLength(lines[lines.length - 1]) + 1,
    // 문서 처음부터 센 위치. 개행도 한 글자로 친다.
    position: graphemeLength(before) + 1,
  };
}

export function lineCount(text: string): number {
  return text.split("\n").length;
}

export function countChars(text: string): { total: number; withoutSpaces: number } {
  return {
    total: graphemeLength(text),
    withoutSpaces: graphemeLength(text.replace(/\s/g, "")),
  };
}
