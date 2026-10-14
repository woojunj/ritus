"use client";

import { ALargeSmall } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";

export const TEXT_SIZE_KEY = "ritus:text-size";

const TEXT_SIZE_OPTIONS = [
  { value: "normal", label: "보통" },
  { value: "large", label: "크게" },
  { value: "xlarge", label: "아주 크게" },
] as const;

type TextSize = (typeof TEXT_SIZE_OPTIONS)[number]["value"];

// 화면을 처음 그리기 전에 저장된 크기를 <html>에 붙여, 작게 떴다가 커지는 깜빡임을 막는다.
// app/layout.tsx의 <head>에 넣는다.
export const TEXT_SIZE_SCRIPT = `(function(){try{var s=localStorage.getItem("${TEXT_SIZE_KEY}");if(s==="large"||s==="xlarge")document.documentElement.dataset.textSize=s}catch(e){}})()`;

function readTextSize(): TextSize {
  const value = document.documentElement.dataset.textSize;
  return value === "large" || value === "xlarge" ? value : "normal";
}

// 누를 때마다 보통 → 크게 → 아주 크게 순서로 화면 전체의 글자와 아이콘 크기를 바꾼다.
// 모든 크기가 기본 글자 크기(rem)를 따르므로 <html>의 글자 크기만 바꾸면 된다.
export function TextSizeToggle() {
  const mounted = useMounted();
  const [chosen, setChosen] = useState<TextSize | null>(null);

  const current = chosen ?? (mounted ? readTextSize() : "normal");
  const index = TEXT_SIZE_OPTIONS.findIndex((option) => option.value === current);
  const { label } = TEXT_SIZE_OPTIONS[index];
  const next = TEXT_SIZE_OPTIONS[(index + 1) % TEXT_SIZE_OPTIONS.length].value;

  function handleClick() {
    if (next === "normal") delete document.documentElement.dataset.textSize;
    else document.documentElement.dataset.textSize = next;
    try {
      localStorage.setItem(TEXT_SIZE_KEY, next);
    } catch {
      // 저장하지 못해도 지금 화면에는 적용된다.
    }
    setChosen(next);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title={`크게 보기: ${label}`}
      className={cn(current !== "normal" && "bg-secondary text-foreground")}
      onClick={handleClick}
    >
      <ALargeSmall aria-hidden="true" />
      <span className="sr-only">크게 보기: {label}</span>
    </Button>
  );
}
