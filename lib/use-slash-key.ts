"use client";

import { useEffect, useRef } from "react";

// 글을 쓰는 칸에 커서가 있으면 "/"는 글자로 쓰여야 하므로 가로채지 않는다.
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.matches("input, textarea, select");
}

// enabled인 동안 입력 칸 밖에서 "/"를 누르면 onSlash를 부른다.
// Ctrl, Cmd, Alt 조합은 브라우저 단축키이므로 건드리지 않는다.
// 브라우저의 "/" 빠른 찾기(파이어폭스)는 이 키를 막아서 대신 앱 검색을 연다.
export function useSlashKey(enabled: boolean, onSlash: () => void): void {
  const handler = useRef(onSlash);

  useEffect(() => {
    handler.current = onSlash;
  });

  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.isComposing) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTyping(event.target)) return;
      event.preventDefault();
      handler.current();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
