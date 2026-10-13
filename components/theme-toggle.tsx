"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { useMounted } from "@/lib/use-mounted";

const THEME_OPTIONS = [
  { value: "light", label: "라이트 모드", icon: Sun },
  { value: "dark", label: "다크 모드", icon: Moon },
  { value: "system", label: "시스템 설정 따르기", icon: Monitor },
] as const;

// 버튼 하나에 지금 테마의 아이콘만 보이고, 누를 때마다 라이트 → 다크 →
// 시스템 순서로 바뀐다. 헤더에서 자리를 덜 차지하도록 선택지를 펼치지 않는다.
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  const currentTheme = mounted ? theme ?? "system" : "system";
  const currentIndex = Math.max(
    0,
    THEME_OPTIONS.findIndex((option) => option.value === currentTheme)
  );
  const { label, icon: Icon } = THEME_OPTIONS[currentIndex];
  const next = THEME_OPTIONS[(currentIndex + 1) % THEME_OPTIONS.length];

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title={`테마 선택: ${label}`}
      onClick={() => setTheme(next.value)}
    >
      <Icon aria-hidden="true" />
      <span className="sr-only">테마 선택: {label}</span>
    </Button>
  );
}
