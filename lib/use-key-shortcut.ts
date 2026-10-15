"use client";

import { useEffect, useRef } from "react";

// 글을 쓰는 칸에 커서가 있으면 키는 글자로 쓰여야 하므로 가로채지 않는다.
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.matches("input, textarea, select");
}

// enabled인 동안 key를 누르면 onPress를 부른다. 글 칸에 커서가 있을 때는 무시한다.
// Ctrl, Cmd, Alt 조합은 브라우저 단축키이므로 건드리지 않는다.
// onlyWhenNothingFocused를 켜면 아무 것에도 포커스가 없을 때만 동작한다. 버튼에 포커스가
// 있으면 Space가 그 버튼을 누르는 뜻이라, 두 동작이 겹치지 않도록 할 때 쓴다.
export function useKeyShortcut(
  key: string,
  enabled: boolean,
  onPress: () => void,
  { onlyWhenNothingFocused = false }: { onlyWhenNothingFocused?: boolean } = {}
): void {
  const handler = useRef(onPress);

  useEffect(() => {
    handler.current = onPress;
  });

  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== key || event.isComposing) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTyping(event.target)) return;
      if (onlyWhenNothingFocused && event.target !== document.body) return;
      event.preventDefault();
      handler.current();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, key, onlyWhenNothingFocused]);
}
