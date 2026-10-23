"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CircleHelp, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const SHEET_STEPS = [
  { target: "matter", title: "돌아볼 사안 하나 적기", text: "무슨 일이 있었는지 적습니다. 예를 들어 ‘피곤해서 가족에게 거칠게 대답했다’처럼, 돌아보고 싶은 일 하나로 시작해 보세요." },
  { target: "virtue", title: "여섯 덕목으로 돌아보기", text: "몰입·사랑·정의·예절·성실·지혜의 질문을 읽고 내 생각을 적습니다. 여기 보이는 몰입부터 아래로 차례로 살펴보세요. 모든 칸을 한 번에 채울 필요는 없습니다." },
  { target: "signal", title: "지금 느끼는 신호 고르기", text: "각 덕목에서 찜찜·찜자·자찜·자명 중 지금 느끼는 신호를 직접 고릅니다. 같은 신호를 다시 누르면 해제됩니다. 아직 모르겠다면 비워 두어도 됩니다." },
  { target: "chart", title: "도표에서 신호 살펴보기", text: "각 덕목에서 고른 신호가 이 도표에 표시됩니다. 고르지 않은 덕목은 표시하지 않습니다. 점수나 성적이 아니며, 신호는 도표가 아니라 각 덕목의 버튼에서 고릅니다." },
  { target: "conclusion", title: "최종 결론과 작은 실천", text: "돌아보며 알게 된 점과 지금 할 수 있는 작은 행동을 적습니다. 예를 들어 ‘말투가 거칠었다고 인정하고 가족의 하루를 물어보겠다’처럼 정리할 수 있습니다." },
  { target: "helper", title: "양심성찰 도우미에게 물어보기", text: "홍익학당 양심성찰 도우미(ChatGPT)를 새 탭으로 엽니다. 쓴 글은 자동으로 보내지 않습니다. 필요한 내용만 직접 복사해 도우미에 붙여넣으세요. 도우미에 붙여넣은 글은 OpenAI에 저장되므로 개인정보는 먼저 빼 주세요." },
  { target: "copy", title: "이 한 장을 글로 복사하기", text: "현재 양심노트 한 장을 날짜·사안·덕목별 글과 신호·최종 결론이 담긴 글로 클립보드에 복사합니다. 도우미에게 물어보거나 다른 곳으로 옮길 때 직접 붙여넣어 사용할 수 있습니다." },
  { target: "paste", title: "복사한 글을 양심노트에 붙여넣기", text: "클립보드의 글을 이 한 장에 더합니다. 양심성찰 도우미에서 복사한 내용을 붙여넣어 양심노트로 저장할 수도 있습니다.\n자세한 방법은 도움말을 참고하세요.\n\n빈 칸은 채우고 이미 쓴 글에는 한 줄 띄워 이어 붙이며, 날짜와 선택한 신호는 유지합니다. 여러 장은 목록에서 붙여넣으세요. 클립보드 권한이 없으면 직접 붙여넣는 창이 열립니다." },
  { target: "download", title: "이 한 장을 파일로 저장하기", text: "현재 양심노트 한 장을 txt 파일로 내려받습니다. 브라우저의 자동 저장과 별도로 보관하거나 옮길 때 사용하세요. 다시 가져오려면 목록의 ‘양심노트 불러오기’를 누릅니다. 파일에는 작성한 내용이 담기므로 보관할 위치를 확인하세요." },
  { target: "save", title: "자동 저장과 완료", text: "입력한 내용은 이 브라우저에 자동 저장됩니다. 저장 상태를 확인하고, ‘완료’를 누르면 목록으로 돌아갑니다. ‘저장하지 못함’이 보이면 파일로 백업하세요. 안내를 마쳐도 작성 내용은 그대로입니다." },
] as const;

const LIST_STEPS = [
  { target: "create", title: "양심노트 시작하고 찾기", text: "이 + 버튼을 누르면 사안 하나를 돌아볼 새 양심노트가 열립니다. 한 장 화면의 도움말(?)에서 작성법과 도우미·복사·붙여넣기·파일 저장을 순서대로 안내합니다. 이미 쓴 노트는 목록에서 열면 됩니다.\n양심노트를 작성하면 목록 제목 옆에 돋보기(검색) 버튼이 나타납니다. 돋보기를 눌러 글이나 선택한 신호로 양심노트를 찾을 수 있습니다. 검색을 닫으면 전체 목록이 다시 보입니다." },
] as const;

type Highlight = { x: number; y: number; width: number; height: number; viewportWidth: number; viewportHeight: number; panelTop: number };

// 실제 입력 칸을 비추되, 안내만으로 노트 생성·수정·저장이 일어나지는 않는다.
export function NoteHelp({ mode }: { mode: "list" | "sheet" }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const steps = mode === "sheet" ? SHEET_STEPS : LIST_STEPS;
  const current = steps[step];
  const dialog = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const id = useId();

  useEffect(() => {
    if (!open || !dialog.current) return;
    const modal = dialog.current;
    const helpButton = trigger.current;
    const scroller = helpButton?.closest("main");
    const originalTop = scroller?.scrollTop ?? 0;
    const sheet = helpButton?.closest<HTMLElement>("[data-note-help-root]");
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
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const target = document.querySelector<HTMLElement>(`[data-note-help="${current.target}"]`);
    if (!target) return;
    const scroller = trigger.current?.closest("main");
    const update = () => {
      const rect = target.getBoundingClientRect();
      const panelTop = panel.current?.getBoundingClientRect().top ?? innerHeight;
      const x = Math.max(8, rect.left - 6);
      const y = Math.max(8, rect.top - 6);
      setHighlight({ x, y, width: Math.max(0, Math.min(rect.right + 6, innerWidth - 8) - x), height: Math.max(0, Math.min(rect.bottom + 6, panelTop - 24) - y), viewportWidth: innerWidth, viewportHeight: innerHeight, panelTop });
    };
    const position = () => {
      if (scroller) {
        const top = scroller.getBoundingClientRect().top + 18;
        scroller.scrollTop += target.getBoundingClientRect().top - top;
      }
      update();
    };
    const frame = requestAnimationFrame(position);
    const observer = new ResizeObserver(position);
    observer.observe(target);
    if (panel.current) observer.observe(panel.current);
    window.addEventListener("resize", position);
    scroller?.addEventListener("scroll", update);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", position);
      scroller?.removeEventListener("scroll", update);
    };
  }, [open, current]);

  return <>
    <Button ref={trigger} type="button" variant="ghost" size="icon" title="양심노트 도움말" aria-label="양심노트 도움말" onClick={() => { setStep(0); setOpen(true); }}>
      <CircleHelp aria-hidden="true" />
    </Button>
    {open && <dialog ref={dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={(event) => { event.preventDefault(); setOpen(false); }} className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden border-0 bg-transparent p-0 text-foreground outline-none backdrop:bg-transparent">
      {highlight && <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" viewBox={`0 0 ${highlight.viewportWidth} ${highlight.viewportHeight}`}>
        <defs><mask id={`${id}-mask`}><rect width="100%" height="100%" fill="white" /><rect x={highlight.x} y={highlight.y} width={highlight.width} height={highlight.height} rx="12" fill="black" /></mask><marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="white" /></marker></defs>
        <rect width="100%" height="100%" fill="black" fillOpacity="0.65" mask={`url(#${id}-mask)`} />
        <rect data-testid="note-help-highlight" x={highlight.x} y={highlight.y} width={highlight.width} height={highlight.height} rx="12" fill="none" className="stroke-primary" strokeWidth="3" />
        <path d={`M ${highlight.viewportWidth / 2} ${highlight.panelTop - 10} Q ${highlight.x + highlight.width / 2} ${highlight.panelTop - 24} ${highlight.x + highlight.width / 2} ${highlight.y + highlight.height + 10}`} fill="none" stroke="currentColor" strokeWidth="2" className="text-white" markerEnd={`url(#${id}-arrow)`} />
      </svg>}
      <div ref={panel} className="absolute bottom-4 left-1/2 flex max-h-[48dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 flex-col gap-4 overflow-y-auto rounded-2xl border bg-popover p-5 text-popover-foreground shadow-xl">
        <div className="flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">양심노트 사용 안내 · {step + 1} / {steps.length}</p><Button type="button" variant="ghost" size="icon-sm" aria-label="안내 닫기" onClick={() => setOpen(false)}><X aria-hidden="true" /></Button></div>
        <div aria-live="polite" aria-atomic="true" className="flex flex-col gap-2"><h2 id={`${id}-title`} className="font-heading text-lg font-semibold">{current.title}</h2><p id={`${id}-description`} className="whitespace-pre-line text-sm leading-relaxed">{current.text}</p></div>
        <div className="flex items-center justify-between gap-3"><Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep(value => value - 1)}>이전</Button><Button type="button" onClick={() => step === steps.length - 1 ? setOpen(false) : setStep(value => value + 1)}>{step === steps.length - 1 ? mode === "sheet" ? "안내 마치고 작성하기" : "안내 마치기" : "다음"}</Button></div>
      </div>
    </dialog>}
  </>;
}
