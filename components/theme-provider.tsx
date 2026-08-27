"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      // Next.js 16은 렌더링 중 만나는 <script> 태그에 개발 모드 경고를 낸다.
      // 서버 렌더 시에만 실행되도록 type을 분기해 경고를 피한다.
      // https://nextjs.org/docs/app/guides/preventing-flash-before-hydration#themes
      scriptProps={{
        type: typeof window === "undefined" ? "text/javascript" : "text/plain",
      }}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
