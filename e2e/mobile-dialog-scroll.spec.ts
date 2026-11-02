import { expect, test, type Page } from "@playwright/test";

async function cancelVisibleDialog(page: Page, name = "취소") {
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  const rect = (await dialog.boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(rect.y).toBeGreaterThanOrEqual(0);
  expect(rect.y + rect.height).toBeLessThanOrEqual(viewport.height);
  expect(rect.x).toBeGreaterThanOrEqual(0);
  expect(rect.x + rect.width).toBeLessThanOrEqual(viewport.width);
  const cancel = dialog.getByRole("button", { name, exact: true });
  await cancel.scrollIntoViewIfNeeded();
  await expect(cancel).toBeInViewport();
  await cancel.click();
  await expect(dialog).toHaveCount(0);
}

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 664 }]) {
  test(`큰 글자의 모바일 설명 창을 끝까지 읽고 닫을 수 있다 ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.evaluate(() => {
      document.documentElement.dataset.textSize = "xlarge";
      document.documentElement.classList.add("dark");
    });
    const notice = page.getByRole("complementary", { name: "저장 위치 안내" });
    await notice.getByRole("button", { name: "자세히", exact: true }).click();
    const dialog = page.getByRole("alertdialog");
    const rect = (await dialog.boundingBox())!;
    expect(rect.y).toBeGreaterThanOrEqual(0);
    expect(rect.y + rect.height).toBeLessThanOrEqual(viewport.height);
    await expect(dialog.getByRole("heading", { name: "쓴 내용이 저장되는 곳" })).toBeInViewport();
    expect(await dialog.evaluate(element => getComputedStyle(element).overflowY)).toBe("auto");
    expect(await dialog.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
    await dialog.hover();
    await page.mouse.wheel(0, 500);
    await expect.poll(() => dialog.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
    const close = dialog.getByRole("button", { name: "닫기", exact: true });
    await close.scrollIntoViewIfNeeded();
    await expect(close).toBeInViewport();
    await page.screenshot({ path: `test-results/storage-dialog-scrolled-${viewport.width}.png` });
    await close.click();
    await expect(dialog).toHaveCount(0);

    await notice.getByRole("button", { name: "확인", exact: true }).click();
    await page.getByRole("button", { name: "설치 안내", exact: true }).click();
    const installRect = (await dialog.boundingBox())!;
    expect(installRect.y).toBeGreaterThanOrEqual(0);
    expect(installRect.y + installRect.height).toBeLessThanOrEqual(viewport.height);
    await dialog.getByRole("button", { name: "닫기", exact: true }).scrollIntoViewIfNeeded();
    await expect(dialog.getByRole("button", { name: "닫기", exact: true })).toBeInViewport();
    await dialog.getByRole("button", { name: "닫기", exact: true }).click();
    await expect(dialog).toHaveCount(0);
  });
}

test("다른 확인·붙여넣기·백업 창도 큰 글자의 좁은 화면에서 닫을 수 있다", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => document.addEventListener("DOMContentLoaded", () => { document.documentElement.dataset.textSize = "xlarge"; }));
  await page.goto("/memo");
  await page.getByRole("complementary", { name: "저장 위치 안내" }).getByRole("button", { name: "확인", exact: true }).click();
  await page.getByRole("button", { name: "설치 안내 닫기", exact: true }).click();
  const body = page.getByLabel("메모 본문");
  await body.fill("보관할 메모");
  await page.getByRole("button", { name: "메모 저장", exact: true }).click();
  await body.fill("지금 쓰는 글");
  await page.getByRole("button", { name: "저장한 메모 목록", exact: true }).click();
  await page.getByRole("button", { name: '"보관할 메모" 불러오기', exact: true }).click();
  await cancelVisibleDialog(page);
  await page.getByRole("button", { name: '"보관할 메모" 삭제', exact: true }).click();
  await cancelVisibleDialog(page);
  await page.getByRole("button", { name: "편집으로 돌아가기", exact: true }).click();
  await page.getByLabel("파일 불러오기 파일", { exact: true }).setInputFiles({ name: "다른글.txt", mimeType: "text/plain", buffer: Buffer.from("새 글") });
  await cancelVisibleDialog(page);

  await page.getByRole("button", { name: "전체 백업", exact: true }).click();
  await cancelVisibleDialog(page, "닫기");
  await page.getByRole("button", { name: "전체 백업", exact: true }).click();
  await page.getByLabel("백업 파일", { exact: true }).setInputFiles({ name: "백업.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ app: "ritus", memo: { text: "복원할 글", format: "txt" }, todos: [], conscienceNotes: [] })) });
  await cancelVisibleDialog(page);

  await page.getByRole("link", { name: "양심노트", exact: true }).click();
  await page.getByRole("button", { name: "새 양심노트 쓰기", exact: true }).click();
  await page.getByRole("button", { name: "양심노트 삭제", exact: true }).click();
  await cancelVisibleDialog(page);
  await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { readText: async () => { throw Error("denied"); } } }));
  await page.getByRole("button", { name: "클립보드에서 붙여넣기", exact: true }).click();
  await cancelVisibleDialog(page);
  await page.getByRole("button", { name: "양심노트 도움말", exact: true }).click();
  const guide = page.getByRole("dialog");
  for (let step = 0; step < 10; step += 1) {
    const panel = guide.getByRole("heading").locator("../..");
    const panelRect = (await panel.boundingBox())!;
    expect(panelRect.y).toBeGreaterThanOrEqual(0);
    expect(panelRect.y + panelRect.height).toBeLessThanOrEqual(568);
    await guide.getByRole("button", { name: step === 9 ? "안내 마치고 작성하기" : "다음", exact: true }).click();
  }
  await expect(guide).toHaveCount(0);

  await page.getByRole("link", { name: "타이머", exact: true }).click();
  await page.getByRole("button", { name: "시작", exact: true }).click();
  await page.getByRole("link", { name: "할 일 목록", exact: true }).click();
  await page.getByLabel("새 할 일", { exact: true }).fill("다른 일");
  await page.getByRole("button", { name: "할 일 추가", exact: true }).click();
  await page.getByRole("link", { name: '"다른 일" 타이머 시작', exact: true }).click();
  await cancelVisibleDialog(page);
});
