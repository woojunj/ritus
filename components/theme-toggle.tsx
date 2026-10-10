"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

const THEME_OPTIONS = [
  { value: "light", label: "라이트 모드", icon: Sun },
  { value: "dark", label: "다크 모드", icon: Moon },
  { value: "system", label: "시스템 설정 따르기", icon: Monitor },
] as const;

const noopSubscribe = () => () => {};

// 서버는 항상 "system"으로 렌더링하지만 클라이언트의 실제 테마는 마운트된
// 뒤에만 안다. 이펙트에서 setState로 그 간극을 메우면 리렌더가 한 번 더
// 생기고 최근 lint 규칙에도 걸리므로, 마운트 여부 자체를 useSyncExternalStore로
// 구독한다(구독 대상은 바뀌지 않으니 subscribe는 아무 일도 하지 않는다).
function useMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

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
      onClick={() => setTheme(next.value)}
    >
      <Icon aria-hidden="true" />
      <span className="sr-only">테마 선택: {label}</span>
    </Button>
  );
}
