"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Hexagon,
  ListTodo,
  NotebookPen,
  Timer,
  type LucideIcon,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { MuteToggle } from "@/features/focus-timer";
import { cn } from "@/lib/utils";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "타이머", icon: Timer },
  { href: "/memo", label: "메모장", icon: NotebookPen },
  { href: "/todos", label: "할 일 목록", icon: ListTodo },
  { href: "/conscience", label: "양심노트", icon: Hexagon },
];

// /timer는 /와 같은 타이머 화면이다.
function isCurrent(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/" || pathname === "/timer";
  return pathname === href;
}

// 네 화면이 함께 쓰는 헤더. 같은 자리에 같은 순서로 네 화면의 아이콘을 두고
// 지금 화면을 강조한다.
export function AppHeader() {
  const pathname = usePathname() ?? "/";

  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b px-3 py-2 sm:px-4">
      <span className="font-heading text-lg font-semibold tracking-tight">
        ritus
      </span>
      <nav aria-label="화면 이동" className="flex items-center gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const current = isCurrent(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={current ? "page" : undefined}
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-md transition-colors",
                current
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center justify-end gap-1">
        <ThemeToggle />
        <MuteToggle />
      </div>
    </header>
  );
}
