import type { MemoFormat } from "./storage";

function dateStamp(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export function downloadMemo(text: string, format: MemoFormat): void {
  const type = format === "md" ? "text/markdown" : "text/plain";
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `ritus-memo-${dateStamp(new Date())}.${format}`;
  anchor.click();
  URL.revokeObjectURL(url);
}
