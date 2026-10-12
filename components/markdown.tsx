import ReactMarkdown, { type Components } from "react-markdown";

import { cn } from "@/lib/utils";

// 마크다운 요소 스타일. typography 플러그인 없이 필요한 만큼만 둔다.
const MARKDOWN_CLASS = cn(
  "space-y-3 text-sm leading-relaxed",
  "[&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold",
  "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5",
  "[&_a]:text-primary [&_a]:underline",
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:font-mono",
  "[&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_pre_code]:p-0",
  "[&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground"
);

// 마크다운 글을 서식대로 그린다. 글 안의 HTML은 그리지 않는다.
export function Markdown({
  children,
  components,
  className,
}: {
  children: string;
  components?: Components;
  className?: string;
}) {
  return (
    <div className={cn(MARKDOWN_CLASS, className)}>
      <ReactMarkdown components={components}>{children}</ReactMarkdown>
    </div>
  );
}
