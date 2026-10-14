import { execFileSync } from "node:child_process";

// process.env를 그대로 받는다. 쓰는 값은 VERCEL_GIT_COMMIT_SHA와 VERCEL_GIT_COMMIT_MESSAGE다.
type BuildEnv = Record<string, string | undefined>;

/** 로컬 저장소에서 읽은 지금 체크아웃된 커밋 */
export interface LocalGit {
  sha: string;
  message: string;
  /** 커밋하지 않은 수정이 있는지 */
  dirty: boolean;
}

const DATE_FORMAT = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "long",
  timeZone: "Asia/Seoul",
});

// 머지한 PR의 커밋 메시지는 첫 줄이 "(#70)"으로 끝난다.
const PATCHSET = /\(#(\d+)\)\s*$/;

function patchsetOf(message: string | undefined): string | undefined {
  const number = message?.split("\n")[0].match(PATCHSET)?.[1];
  return number && `#${number}`;
}

/**
 * 도움말 맨 아래에 적는 빌드 정보. Vercel이 빌드할 때 넘겨주는 커밋 정보로 만든다.
 * 그 정보가 없으면(로컬) "개발 중"이라 적고, 로컬 저장소의 커밋을 덧붙인다.
 * 로컬에서는 화면을 열 때마다 시각이 바뀌어 날짜는 적지 않는다.
 */
export function buildInfoText(env: BuildEnv, builtAt: Date, local: LocalGit | null): string {
  const sha = env.VERCEL_GIT_COMMIT_SHA;
  if (sha) {
    return [
      `업데이트 ${DATE_FORMAT.format(builtAt)}`,
      patchsetOf(env.VERCEL_GIT_COMMIT_MESSAGE),
      sha.slice(0, 7),
    ]
      .filter(Boolean)
      .join(" · ");
  }
  if (!local) return "개발 중";
  const commit = local.sha.slice(0, 7) + (local.dirty ? " (수정 있음)" : "");
  return ["개발 중", patchsetOf(local.message), commit].filter(Boolean).join(" · ");
}

/** 로컬 저장소의 커밋을 읽는다. git이 없거나 저장소가 아니면 null이다. */
export function readLocalGit(): LocalGit | null {
  const git = (...args: string[]) =>
    execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  try {
    return {
      sha: git("rev-parse", "HEAD").trim(),
      message: git("log", "-1", "--format=%B"),
      dirty: git("status", "--porcelain").trim() !== "",
    };
  } catch {
    return null;
  }
}
