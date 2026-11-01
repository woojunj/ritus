"use client";

import { useEffect, useId, useRef, useState } from "react";

// 설치를 미뤄도 다시 찾을 수 있도록, 조작을 막지 않는 짧은 안내를 띄운다.
export function InstallReminder({ onDone }: { onDone: () => void }) {
  const id = useId();
  const message = useRef<HTMLParagraphElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number; width: number; height: number; top: number; left: number; startX: number } | null>(null);
  useEffect(() => {
    const target = document.querySelector<HTMLElement>('[data-header-help="manual"]');
    const update = () => {
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const headerBottom = target.closest("header")?.getBoundingClientRect().bottom ?? rect.bottom;
      const messageWidth = message.current?.getBoundingClientRect().width ?? 0;
      const left = Math.max(16, Math.min(rect.x + rect.width / 2 - messageWidth / 2, innerWidth - messageWidth - 16));
      setPosition({ x: rect.x - 4, y: rect.y - 4, width: rect.width + 8, height: rect.height + 8, top: headerBottom + 64, left, startX: left + messageWidth / 2 });
    };
    update();
    const observer = new ResizeObserver(update);
    if (target) observer.observe(target);
    if (target?.closest("header")) observer.observe(target.closest("header")!);
    if (message.current) observer.observe(message.current);
    window.addEventListener("resize", update);
    target?.addEventListener("click", onDone);
    const timer = setTimeout(onDone, 4000);
    return () => { observer.disconnect(); window.removeEventListener("resize", update); target?.removeEventListener("click", onDone); clearTimeout(timer); };
  }, [onDone]);

  return <div className="pointer-events-none fixed inset-0" data-testid="install-reminder">
    {position && <>
      <svg aria-hidden="true" className="absolute inset-0 size-full text-primary">
        <defs><marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" /></marker></defs>
        <rect data-testid="install-help-highlight" x={position.x} y={position.y} width={position.width} height={position.height} rx="10" fill="none" stroke="currentColor" strokeWidth="3" />
        <path data-testid="install-help-arrow" d={`M ${position.startX} ${position.top - 8} Q ${position.x + position.width / 2} ${position.top - 28} ${position.x + position.width / 2} ${position.y + position.height + 10}`} fill="none" stroke="currentColor" strokeWidth="3" markerEnd={`url(#${id})`} />
      </svg>
    </>}
    <p ref={message} role="status" className="absolute w-[calc(100%-2rem)] max-w-sm rounded-xl border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-lg" style={{ top: position?.top ?? 0, left: position?.left ?? 16, visibility: position ? "visible" : "hidden" }}><strong>도움말 → 앱 설치 안내</strong>에서 설치할 수 있습니다.</p>
  </div>;
}
