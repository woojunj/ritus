import { dateStamp, type TextFile } from "@/lib/download";

import type { MemoFormat } from "./storage";

export function memoFile(text: string, format: MemoFormat): TextFile {
  return {
    name: `ritus-memo-${dateStamp()}.${format}`,
    text,
    type: format === "md" ? "text/markdown" : "text/plain",
  };
}
