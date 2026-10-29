"use client";

import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CircleQuestionMark,
  ListTodo,
  NotebookPen,
  Timer,
} from "lucide-react";

import { ConscienceIcon } from "@/components/conscience-icon";
import { TextSizeToggle } from "@/components/text-size-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { MuteToggle } from "@/features/focus-timer";
import { cn } from "@/lib/utils";

import { BackupButton } from "./backup-button";

const NAV_ITEMS: { href: string; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { href: "/", label: "타이머", icon: Timer },
  { href: "/memo", label: "메모장", icon: NotebookPen },
  { href: "/todos", label: "할 일 목록", icon: ListTodo },
  { href: "/conscience", label: "양심노트", icon: ConscienceIcon },
];

// /timer는 /와 같은 타이머 화면이다.
function isCurrent(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/" || pathname === "/timer";
  return pathname === href;
}

const ICON_LINK_CLASS =
  "inline-flex size-9 items-center justify-center rounded-md transition-colors";
const CURRENT_CLASS = "bg-secondary text-foreground";

// 네 화면이 함께 쓰는 헤더. 같은 자리에 같은 순서로 네 화면의 아이콘을 두고
// 지금 화면을 강조한다.
export function AppHeader() {
  const pathname = usePathname() ?? "/";

  return (
    // 폭이 넉넉하면 이름, 화면 아이콘, 설정 아이콘을 한 줄에 펼친다. 폰 너비나 크게 보기처럼
    // 한 줄에 다 들어가지 않으면 화면 아이콘 아래로 설정 아이콘을 넘겨 가운데에 둔다.
    <header className="flex flex-wrap items-center justify-center gap-1 border-b px-3 py-2 sm:px-4 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-2">
      {/* 폰 너비에서는 아이콘이 한 줄에 들어오도록 이름을 감춘다. */}
      <span className="hidden font-heading text-lg font-semibold tracking-tight sm:inline">
        ritus
      </span>
      <nav data-header-help="navigation" aria-label="화면 이동" className="flex items-center gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const current = isCurrent(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              aria-current={current ? "page" : undefined}
              className={cn(
                ICON_LINK_CLASS,
                current
                  ? CURRENT_CLASS
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-1 lg:justify-end">
        <Link
          href="/help"
          data-header-help="manual"
          aria-label="도움말"
          title="도움말"
          aria-current={pathname === "/help" ? "page" : undefined}
          className={cn(
            ICON_LINK_CLASS,
            pathname === "/help" ? CURRENT_CLASS : "hover:bg-muted"
          )}
        >
          <CircleQuestionMark className="h-4 w-4" aria-hidden="true" />
        </Link>
        <span className="inline-flex" data-header-help="backup"><BackupButton /></span>
        <span className="inline-flex" data-header-help="theme"><ThemeToggle /></span>
        <span className="inline-flex" data-header-help="size"><TextSizeToggle /></span>
        <span className="inline-flex" data-header-help="sound"><MuteToggle /></span>
      </div>
    </header>
  );
}
