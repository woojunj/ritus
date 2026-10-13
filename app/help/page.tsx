import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isValidElement, type ReactNode } from "react";
import type { Components } from "react-markdown";

import { Markdown } from "@/components/markdown";
import { SessionBar } from "@/features/focus-timer";

// 저장소의 매뉴얼을 그대로 보여 준다. 문서를 고치면 이 화면도 함께 바뀐다.
const manual = await readFile(join(process.cwd(), "docs/manual.md"), "utf8");

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

// 문서 안의 "#전체-백업" 같은 링크가 닿도록 제목에 GitHub와 같은 방식의 id를 붙인다.
function headingId(children: ReactNode): string {
  return textOf(children)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

const COMPONENTS: Components = {
  h2: ({ children }) => <h2 id={headingId(children)}>{children}</h2>,
  h3: ({ children }) => <h3 id={headingId(children)}>{children}</h3>,
};

export default function HelpPage() {
  return (
    <>
      <SessionBar />
      <article className="mx-auto w-full max-w-2xl px-4 py-8">
        <Markdown
          components={COMPONENTS}
          className="[&_h2]:mt-8 [&_h2]:border-t [&_h2]:pt-6 [&_h3]:mt-6"
        >
          {manual}
        </Markdown>
      </article>
    </>
  );
}
