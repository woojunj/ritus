"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  const currentTheme = mounted ? theme ?? "system" : "system";

  return (
    <ToggleGroup
      variant="outline"
      spacing={0}
      value={[currentTheme]}
      onValueChange={(next) => {
        const nextTheme = next[0];
        if (nextTheme) setTheme(nextTheme);
      }}
      aria-label="테마 선택"
    >
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
        <ToggleGroupItem key={value} value={value} size="sm" aria-label={label}>
          <Icon aria-hidden="true" />
          <span className="sr-only">{label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
