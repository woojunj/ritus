import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  Fragment,
  isValidElement,
  type ComponentType,
  type ReactNode,
  type SVGProps,
} from "react";
import {
  ALargeSmall,
  ArrowLeftRight,
  Check,
  CircleQuestionMark,
  ClipboardPaste,
  Copy,
  DatabaseBackup,
  Download,
  Eye,
  ListTodo,
  NotebookPen,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Square,
  Sun,
  Timer,
  Trash2,
  Upload,
  Volume2,
} from "lucide-react";
import type { Components } from "react-markdown";

import { ConscienceIcon } from "@/components/conscience-icon";
import { Markdown } from "@/components/markdown";
import { HelperRequestCopy } from "@/features/conscience-note";
import { SessionBar } from "@/features/focus-timer";

import { buildInfoText, readLocalGit } from "./build-info";

// 저장소의 매뉴얼을 그대로 보여 준다. 문서를 고치면 이 화면도 함께 바뀐다.
const manual = await readFile(join(process.cwd(), "docs/manual.md"), "utf8");

// 문서에서 이 주석이 있는 자리에 도우미에게 보낼 글을 복사하는 버튼을 끼운다.
// 저장소에서 문서를 읽을 때는 주석이라 보이지 않는다.
const HELPER_COPY_MARK = "<!-- 도우미에게 보낼 글 복사 -->";

// 문서에서 "<!-- 아이콘: 복사 -->"가 있는 자리에 그 이름의 아이콘을 그린다. 각 화면의
// 버튼과 같은 아이콘을 쓴다. 테마와 소리는 상태마다 아이콘이 달라 하나만 보인다.
const ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  타이머: Timer,
  메모장: NotebookPen,
  "할 일 목록": ListTodo,
  양심노트: ConscienceIcon,
  도움말: CircleQuestionMark,
  "전체 백업": DatabaseBackup,
  테마: Sun,
  "크게 보기": ALargeSmall,
  소리: Volume2,
  재생: Play,
  일시정지: Pause,
  그만두기: Square,
  눈: Eye,
  되돌리기: RotateCcw,
  반복: ArrowLeftRight,
  복사: Copy,
  저장: Download,
  불러오기: Upload,
  붙여넣기: ClipboardPaste,
  더하기: Plus,
  휴지통: Trash2,
  완료: Check,
  도우미: Sparkles,
};
const ICON_MARK = /<!-- 아이콘: (.+?) -->/g;

// 마크다운은 글 안의 HTML을 그리지 않으므로, 아이콘 자리를 이미지 문법으로 바꿔 넘긴다.
const PARTS = manual
  .split(HELPER_COPY_MARK)
  .map((part) => part.replace(ICON_MARK, (_, name: string) => `![${name}](#icon)`));

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
  img: ({ alt }) => {
    const Icon = ICONS[alt ?? ""];
    // 이름이 바로 뒤에 글로 나오므로 아이콘은 읽지 않게 한다.
    return Icon ? (
      <Icon aria-hidden="true" className="mr-1 inline size-4 align-[-0.15em]" />
    ) : null;
  },
};

export default function HelpPage() {
  // 배포본은 빌드할 때 한 번 그려지므로 지금 시각이 곧 빌드 시각이다. 개발 서버는
  // 열 때마다 다시 그려서, 커밋하거나 브랜치를 바꾸면 로컬 커밋 정보가 바로 바뀐다.
  const local = process.env.VERCEL_GIT_COMMIT_SHA ? null : readLocalGit();
  const buildInfo = buildInfoText(process.env, new Date(), local);
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
        <p className="border-t pt-6 text-center text-xs text-muted-foreground">{buildInfo}</p>
      </article>
    </>
  );
}
