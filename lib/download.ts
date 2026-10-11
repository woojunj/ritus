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

/** 글을 파일로 내려받게 한다. */
export function downloadTextFile({ name, text, type }: TextFile): void {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}
