import { expect, test, type Page } from "@playwright/test";

async function walkGuide(page: Page, targets: string[], screenshot?: string) {
  await page.getByRole("button", { name: "타이머 도움말", exact: true }).click();
  const dialog = page.getByRole("dialog");
  for (let i = 0; i < targets.length; i++) {
    await expect(dialog.getByText(`타이머 사용 안내 · ${i + 1} / ${targets.length}`, { exact: true })).toBeVisible();
    await expect.poll(async () => {
      const highlight = await page.getByTestId("help-highlight").boundingBox();
      const panel = await dialog.locator("div").first().boundingBox();
      const target = await page.locator(`[data-timer-help="${targets[i]}"]:visible`).boundingBox();
      return !!highlight && !!panel && !!target && highlight.height >= target.height && highlight.width >= target.width && highlight.y >= 0 && highlight.y + highlight.height < panel.y;
    }).toBe(true);
    if (i === 1 && screenshot) await page.screenshot({ path: screenshot });
    await dialog.getByRole("button", { name: i === targets.length - 1 ? "안내 마치기" : "다음", exact: true }).click();
  }
  await expect(dialog).toHaveCount(0);
}

for (const viewport of [{ width: 360, height: 780 }, { width: 1280, height: 900 }]) {
  test(`타이머의 설정·반복·실행·일시정지·종료 안내 ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.clock.install();
    await page.goto("/");
    await page.getByLabel("세션 제목", { exact: true }).fill("오늘 읽을 책");
    await page.getByLabel("시간(분)", { exact: true }).fill("1");
    await walkGuide(page, ["title", "time", "minutes", "repeat", "sound", "start"], `test-results/timer-help-${viewport.width}.png`);
    await expect(page.getByLabel("세션 제목", { exact: true })).toHaveValue("오늘 읽을 책");
    await expect(page.getByLabel("시간(분)", { exact: true })).toHaveValue("1");
    await expect(page.getByRole("button", { name: "번갈아 반복", exact: true })).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("timer")).toHaveCount(0);

    await page.getByRole("button", { name: "번갈아 반복", exact: true }).click();
    const fields = page.getByTestId(viewport.width < 1024 ? "interval-fields-narrow" : "interval-fields-wide");
    await fields.getByLabel("첫 구간(초)", { exact: true }).fill("20");
    await fields.getByLabel("첫 구간(초)", { exact: true }).press("Tab");
    await fields.getByLabel("두 번째 구간(초)", { exact: true }).fill("10");
    await fields.getByLabel("두 번째 구간(초)", { exact: true }).press("Tab");
    await expect(fields.getByLabel("두 번째 구간(초)", { exact: true })).toHaveValue("10");
    await walkGuide(page, ["title", "time", "minutes", "repeat", "first", "second", "summary", "sound", "start"]);
    await expect(fields.getByLabel("첫 구간(초)", { exact: true })).toHaveValue("20");
    await expect(fields.getByLabel("두 번째 구간(초)", { exact: true })).toHaveValue("10");
    await page.getByRole("button", { name: "시작", exact: true }).click();
    await walkGuide(page, ["progress", "clock", "pause", "quit", "sound"]);
    await expect(page.getByRole("button", { name: "일시정지", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "일시정지", exact: true }).click();
    const paused = await page.getByRole("timer").textContent();
    await walkGuide(page, ["progress", "clock", "pause", "quit", "sound"]);
    await expect(page.getByRole("timer")).toHaveText(paused ?? "");
    await expect(page.getByRole("button", { name: "이어서", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "이어서", exact: true }).click();
    await page.getByRole("button", { name: "타이머 도움말", exact: true }).click();
    await page.clock.fastForward(65_000);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByTestId("end-screen")).toBeVisible();
    await page.getByTestId("end-screen").click({ position: { x: 5, y: 5 } });
    await walkGuide(page, ["ending", "restart", "new-setup"]);
    await expect(page.getByTestId("end-screen")).toBeVisible();
    await page.getByRole("button", { name: "타이머 도움말", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "타이머 도움말", exact: true })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
