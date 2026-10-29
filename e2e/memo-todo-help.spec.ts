import { expect, test, type Page } from "@playwright/test";

async function walk(page: Page, name: string, attribute: string, targets: string[], screenshot?: string) {
  const help = page.getByRole("button", { name: `${name} 도움말`, exact: true });
  await help.click();
  const dialog = page.getByRole("dialog");
  for (let index = 0; index < targets.length; index++) {
    await expect(dialog.getByText(`${name} 사용 안내 · ${index + 1} / ${targets.length}`, { exact: true })).toBeVisible();
    await expect.poll(async () => {
      const highlight = await page.getByTestId("help-highlight").boundingBox();
      const target = await page.locator(`[${attribute}="${targets[index]}"]:visible`).boundingBox();
      const panel = await dialog.locator("div").first().boundingBox();
      return !!highlight && !!target && !!panel && target.height > 0 && highlight.height > 20 && highlight.y >= 0 && highlight.y + highlight.height < panel.y;
    }).toBe(true);
    if (index === 1 && screenshot) await page.screenshot({ path: screenshot });
    await dialog.getByRole("button", { name: index === targets.length - 1 ? "안내 마치기" : "다음", exact: true }).click();
  }
  await expect(dialog).toHaveCount(0);
  await expect(help).toBeFocused();
}

for (const viewport of [{ width: 360, height: 780 }, { width: 1280, height: 900 }]) {
  test(`메모장 편집·목록 안내와 데이터 보존 ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/memo");
    const body = page.getByRole("textbox", { name: "메모 본문", exact: true });
    await body.fill("# 회의 정리\n내일 다시 확인할 내용");
    await page.getByRole("tab", { name: "md", exact: true }).click();
    const before = await page.evaluate(() => localStorage.getItem("ritus:memo"));
    await walk(page, "메모장", "data-memo-help", ["format", "content", "autosave", "save", "library", "copy", "download", "import"], `test-results/memo-help-${viewport.width}.png`);
    expect(await page.evaluate(() => localStorage.getItem("ritus:memo"))).toBe(before);
    await expect(body).toHaveValue("# 회의 정리\n내일 다시 확인할 내용");
    if (viewport.width < 768) {
      await page.getByRole("button", { name: "프리뷰 보기", exact: true }).click();
      await walk(page, "메모장", "data-memo-help", ["format", "content", "autosave", "save", "library", "copy", "download", "import"]);
      await expect(page.getByRole("button", { name: "편집하기", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "편집하기", exact: true }).click();
    }
    await page.getByRole("button", { name: "저장한 메모 목록", exact: true }).click();
    await walk(page, "메모장", "data-memo-help", ["saved", "library"]);
    await page.getByRole("button", { name: "편집으로 돌아가기", exact: true }).click();
    await page.getByRole("button", { name: "메모 저장", exact: true }).click();
    await page.getByRole("button", { name: "저장한 메모 목록", exact: true }).click();
    const libraryBefore = await page.evaluate(() => localStorage.getItem("ritus:memo-library"));
    await walk(page, "메모장", "data-memo-help", ["saved", "search", "library"]);
    expect(await page.evaluate(() => localStorage.getItem("ritus:memo-library"))).toBe(libraryBefore);
    await page.getByRole("button", { name: "저장한 메모 검색", exact: true }).click();
    await page.getByRole("searchbox").fill("없는 내용");
    await walk(page, "메모장", "data-memo-help", ["saved", "search", "library"]);
    await expect(page.getByRole("searchbox")).toHaveValue("없는 내용");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test(`할 일 빈 목록·작성 후 안내와 타이머 연결 ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/todos");
    await walk(page, "할 일 목록", "data-todo-help", ["add", "import"]);
    await expect(page.getByRole("listitem")).toHaveCount(0);
    await page.getByRole("textbox", { name: "새 할 일", exact: true }).fill("책 읽기");
    await page.getByRole("button", { name: "할 일 추가", exact: true }).click();
    const before = await page.evaluate(() => localStorage.getItem("ritus:todos"));
    await walk(page, "할 일 목록", "data-todo-help", ["add", "check", "card", "search", "edit", "copy", "download", "import"], `test-results/todo-help-${viewport.width}.png`);
    expect(await page.evaluate(() => localStorage.getItem("ritus:todos"))).toBe(before);
    await page.getByRole("button", { name: "할 일 검색", exact: true }).click();
    await page.getByRole("searchbox").fill("없는 제목");
    await walk(page, "할 일 목록", "data-todo-help", ["add", "search", "edit", "copy", "download", "import"]);
    await expect(page.getByRole("searchbox")).toHaveValue("없는 제목");
    await page.getByRole("button", { name: "검색 닫기", exact: true }).click();
    await page.getByRole("link", { name: '"책 읽기" 타이머 시작', exact: true }).click();
    await expect(page.getByRole("textbox", { name: "세션 제목", exact: true })).toHaveValue("책 읽기");
    await expect(page.getByRole("button", { name: "시작", exact: true })).toBeVisible();
    await expect(page.getByRole("timer")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
