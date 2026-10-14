import { describe, expect, it } from "vitest";

import { buildInfoText } from "./build-info";

const SHA = "dfc713238b94cad5e024dfd5d669c9eb725ea691";
// 한국 시각으로 2026년 10월 15일 오전 8시. UTC로는 아직 14일이다.
const BUILT_AT = new Date("2026-10-14T23:00:00Z");

describe("buildInfoText", () => {
  it("빌드 날짜(한국 시각), PR 번호, 짧은 해시를 적는다", () => {
    const text = buildInfoText(
      {
        VERCEL_GIT_COMMIT_SHA: SHA,
        VERCEL_GIT_COMMIT_MESSAGE: "feat: 신호 칩을 글자로 표시함 (#70)\n\n- 본문 (#12)",
      },
      BUILT_AT,
      null
    );
    expect(text).toBe("업데이트 2026년 10월 15일 · #70 · dfc7132");
  });

  it("PR을 거치지 않은 커밋이면 PR 번호를 빼고 적는다", () => {
    const text = buildInfoText(
      { VERCEL_GIT_COMMIT_SHA: SHA, VERCEL_GIT_COMMIT_MESSAGE: "fix: 바로 고침" },
      BUILT_AT,
      null
    );
    expect(text).toBe("업데이트 2026년 10월 15일 · dfc7132");
  });

  it("Vercel 정보가 없으면 개발 중이라 적고, 로컬 커밋을 날짜 없이 덧붙인다", () => {
    const local = { sha: SHA, message: "feat: 신호 칩 (#70)\n", dirty: false };
    expect(buildInfoText({}, BUILT_AT, local)).toBe("개발 중 · #70 · dfc7132");
  });

  it("커밋하지 않은 수정이 있으면 수정 있음을 붙인다", () => {
    const local = { sha: SHA, message: "wip", dirty: true };
    expect(buildInfoText({}, BUILT_AT, local)).toBe("개발 중 · dfc7132 (수정 있음)");
  });

  it("커밋 정보를 하나도 얻지 못하면 개발 중이라고만 적는다", () => {
    expect(buildInfoText({}, BUILT_AT, null)).toBe("개발 중");
  });
});
