"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CircleHelp, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface HelpStep {
  target: string;
  title: string;
  text: string;
}

interface GuidedHelpProps {
  name: string;
  steps: readonly HelpStep[];
  finishLabel?: string;
  targetAttribute?: string;
  rootAttribute?: string;
  highlightTestId?: string;
}

type Highlight = { x: number; y: number; width: number; height: number; viewportWidth: number; viewportHeight: number; panelTop: number };

// 실제 화면을 비추되, 안내 자체는 대상 기능을 실행하지 않는다.
export function GuidedHelp({ name, steps, finishLabel = "안내 마치기", targetAttribute = "data-help", rootAttribute = "data-help-root", highlightTestId = "help-highlight" }: GuidedHelpProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const current = steps[step];
  const dialog = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [discovering, setDiscovering] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const hintDismissed = useRef(false);
  const hintKey = `ritus:help-hint:${name}:${steps[0].target}:v7`;
  const id = useId();

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    // Strict Mode의 효과 재실행에서도 첫 표시와 5초 종료가 한 쌍으로 실행된다.
    const frame = requestAnimationFrame(() => {
      if (hintDismissed.current) return;
      const preview = process.env.NODE_ENV === "development" && new URLSearchParams(window.location.search).has("help-preview");
      setPreviewing(preview);
      try {
        if (!preview) {
          if (localStorage.getItem(hintKey)) return;
          localStorage.setItem(hintKey, "seen");
        }
      } catch {
        // 시각적 안내의 표시 여부는 글 저장 실패 안내를 띄우지 않는다.
      }
      setDiscovering(true);
      timeout = setTimeout(() => setDiscovering(false), 5000);
    });
    return () => {
      cancelAnimationFrame(frame);
      if (timeout) clearTimeout(timeout);
    };
  }, [hintKey]);

  useEffect(() => {
    if (!open || !dialog.current) return;
    const modal = dialog.current;
    const helpButton = trigger.current;
    const scroller = helpButton?.closest("main");
    const originalTop = scroller?.scrollTop ?? 0;
    const sheet = helpButton?.closest<HTMLElement>(`[${rootAttribute}]`);
    const originalPadding = sheet?.style.paddingBottom ?? "";
    // 마지막 칸도 설명 상자 위로 올릴 수 있도록 안내 중에만 여유를 둔다.
    if (sheet) sheet.style.paddingBottom = "65dvh";
    modal.showModal();
    return () => {
      modal.close();
      if (scroller) {
        scroller.scrollTop = originalTop;
      }
      if (sheet) sheet.style.paddingBottom = originalPadding;
      helpButton?.focus({ preventScroll: true });
    };
  }, [open, rootAttribute]);

  useEffect(() => {
    if (!open) return;
    const targets = Array.from(document.querySelectorAll<HTMLElement>(`[${targetAttribute}="${current.target}"]`));
    const visibleTarget = () => targets.find(target => target.getClientRects().length > 0);
    const scroller = trigger.current?.closest("main");
    const update = () => {
      const target = visibleTarget();
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const panelTop = panel.current?.getBoundingClientRect().top ?? innerHeight;
      const x = Math.max(8, rect.left - 6);
      const y = Math.max(8, rect.top - 6);
      setHighlight({ x, y, width: Math.max(0, Math.min(rect.right + 6, innerWidth - 8) - x), height: Math.max(0, Math.min(rect.bottom + 6, panelTop - 24) - y), viewportWidth: innerWidth, viewportHeight: innerHeight, panelTop });
    };
    const position = () => {
      const target = visibleTarget();
      if (!target) return;
      if (scroller) {
        const top = scroller.getBoundingClientRect().top + 18;
        scroller.scrollTop += target.getBoundingClientRect().top - top;
      }
      update();
    };
    const frame = requestAnimationFrame(position);
    const observer = new ResizeObserver(position);
    targets.forEach(target => observer.observe(target));
    if (panel.current) observer.observe(panel.current);
    window.addEventListener("resize", position);
    scroller?.addEventListener("scroll", update);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", position);
      scroller?.removeEventListener("scroll", update);
    };
  }, [open, current, targetAttribute]);

  return <>
    <Button ref={trigger} type="button" variant="ghost" size="icon" className="relative isolate" title={`${name} 도움말`} aria-label={`${name} 도움말`} onClick={() => { hintDismissed.current = true; setDiscovering(false); setStep(0); setOpen(true); }}>
      {discovering && <span aria-hidden="true" data-testid="help-discovery-ring" data-force-motion={previewing || undefined} className="help-discovery-ring" />}
      <CircleHelp aria-hidden="true" className="relative" />
    </Button>
    {open && <dialog ref={dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={(event) => { event.preventDefault(); setOpen(false); }} className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden border-0 bg-transparent p-0 text-foreground outline-none backdrop:bg-transparent">
      {highlight && <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" viewBox={`0 0 ${highlight.viewportWidth} ${highlight.viewportHeight}`}>
        <defs><mask id={`${id}-mask`}><rect width="100%" height="100%" fill="white" /><rect x={highlight.x} y={highlight.y} width={highlight.width} height={highlight.height} rx="12" fill="black" /></mask><marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="white" /></marker></defs>
        <rect width="100%" height="100%" fill="black" fillOpacity="0.65" mask={`url(#${id}-mask)`} />
        <rect data-testid={highlightTestId} x={highlight.x} y={highlight.y} width={highlight.width} height={highlight.height} rx="12" fill="none" className="stroke-primary" strokeWidth="3" />
        <path d={`M ${highlight.viewportWidth / 2} ${highlight.panelTop - 10} Q ${highlight.x + highlight.width / 2} ${highlight.panelTop - 24} ${highlight.x + highlight.width / 2} ${highlight.y + highlight.height + 10}`} fill="none" stroke="currentColor" strokeWidth="2" className="text-white" markerEnd={`url(#${id}-arrow)`} />
      </svg>}
      <div ref={panel} className="absolute bottom-4 left-1/2 flex max-h-[48dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 flex-col gap-4 overflow-y-auto rounded-2xl border bg-popover p-5 text-popover-foreground shadow-xl">
        <div className="flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">{name} 사용 안내 · {step + 1} / {steps.length}</p><Button type="button" variant="ghost" size="icon-sm" aria-label="안내 닫기" onClick={() => setOpen(false)}><X aria-hidden="true" /></Button></div>
        <div aria-live="polite" aria-atomic="true" className="flex flex-col gap-2"><h2 id={`${id}-title`} className="font-heading text-lg font-semibold">{current.title}</h2><p id={`${id}-description`} className="whitespace-pre-line text-sm leading-relaxed">{current.text}</p></div>
        <div className="flex items-center justify-between gap-3"><Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep(value => value - 1)}>이전</Button><Button type="button" onClick={() => step === steps.length - 1 ? setOpen(false) : setStep(value => value + 1)}>{step === steps.length - 1 ? finishLabel : "다음"}</Button></div>
      </div>
    </dialog>}
  </>;
}
