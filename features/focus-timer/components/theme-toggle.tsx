"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const THEME_OPTIONS = [
  { value: "light", label: "라이트 모드", icon: Sun },
  { value: "dark", label: "다크 모드", icon: Moon },
  { value: "system", label: "시스템 설정 따르기", icon: Monitor },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
