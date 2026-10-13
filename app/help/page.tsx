import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Fragment, isValidElement, type ReactNode } from "react";
import type { Components } from "react-markdown";

import { Markdown } from "@/components/markdown";
import { HelperRequestCopy } from "@/features/conscience-note";
import { SessionBar } from "@/features/focus-timer";

// 저장소의 매뉴얼을 그대로 보여 준다. 문서를 고치면 이 화면도 함께 바뀐다.
const manual = await readFile(join(process.cwd(), "docs/manual.md"), "utf8");

// 문서에서 이 주석이 있는 자리에 도우미에게 보낼 글을 복사하는 버튼을 끼운다.
// 저장소에서 문서를 읽을 때는 주석이라 보이지 않는다.
const HELPER_COPY_MARK = "<!-- 도우미에게 보낼 글 복사 -->";
const PARTS = manual.split(HELPER_COPY_MARK);

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
      <article className="mx-auto w-full max-w-2xl space-y-3 px-4 py-8">
        {PARTS.map((part, index) => (
          <Fragment key={index}>
            {index > 0 && <HelperRequestCopy />}
            <Markdown
              components={COMPONENTS}
              className="[&_h2]:mt-8 [&_h2]:border-t [&_h2]:pt-6 [&_h3]:mt-6"
            >
              {part}
            </Markdown>
          </Fragment>
        ))}
      </article>
    </>
  );
}
