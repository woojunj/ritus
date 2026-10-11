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
    text: `﻿${todosToCsv(items)}`,
    type: "text/csv",
  };
}
