import { dateStamp, type TextFile } from "@/lib/download";

import type { TodoItem } from "./storage";

// 쉼표, 따옴표, 줄바꿈이 든 칸은 따옴표로 감싼다.
function csvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** 할 일 목록을 화면에 보이는 순서대로 "할 일,완주 횟수" CSV로 만든다. */
export function todosToCsv(items: TodoItem[]): string {
  return [
    "할 일,완주 횟수",
    ...items.map((item) => `${csvCell(item.title)},${item.completionCount}`),
  ].join("\n");
}

/** 할 일 목록을 내려받을 CSV 파일. 엑셀이 한글을 바로 읽도록 BOM을 붙인다. */
export function todosFile(items: TodoItem[]): TextFile {
  return {
    name: `ritus-todos-${dateStamp()}.csv`,
    text: `\uFEFF${todosToCsv(items)}`,
    type: "text/csv",
  };
}

// 따옴표로 감싼 칸 안의 쉼표, 줄바꿈, 겹따옴표를 살려서 줄과 칸으로 나눈다.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/**
 * todosToCsv가 만든 CSV를 다시 할 일들로 읽는다. 머리글 줄과 제목이 빈 줄은
 * 건너뛰고, 이미 같은 제목이 있는 할 일은 들이지 않는다.
 */
export function parseTodos(text: string, existing: TodoItem[]): TodoItem[] {
  const titles = new Set(existing.map((item) => item.title));
  const now = Date.now();
  const items: TodoItem[] = [];
  for (const [rawTitle = "", rawCount = ""] of parseCsv(text.replace(/^\uFEFF/, ""))) {
    const title = rawTitle.trim();
    if (!title || titles.has(title)) continue;
    if (items.length === 0 && title === "할 일" && rawCount.trim() === "완주 횟수") continue;
    titles.add(title);
    items.push({
      id: crypto.randomUUID(),
      title,
      completionCount: Math.max(0, Math.floor(Number(rawCount)) || 0),
      createdAt: now - items.length,
    });
  }
  return items;
}
