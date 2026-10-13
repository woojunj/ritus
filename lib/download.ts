/** 날짜를 파일 이름에 넣을 YYYYMMDD로 돌려준다. */
export function dateStamp(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export type TextFile = {
  name: string;
  text: string;
  /** 예: "text/plain" */
  type: string;
};

/**
 * 글을 파일로 내려받게 한다. txt, md, csv 같은 글 파일에는 BOM을 붙인다. BOM이
 * 없으면 폰의 파일 보기나 엑셀이 한글을 다른 인코딩으로 읽어 깨뜨린다. JSON은
 * BOM이 있으면 읽지 못하는 프로그램이 많아 붙이지 않는다.
 */
export function downloadTextFile({ name, text, type }: TextFile): void {
  const bom = type.startsWith("text/") ? "﻿" : "";
  const blob = new Blob([bom, text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}
