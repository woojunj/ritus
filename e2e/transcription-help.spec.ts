import { expect, test, type Page } from "@playwright/test";

async function walkHelp(page: Page, targets: string[]) {
  await page.getByRole("button", { name: "필사 도움말", exact: true }).click();
  const dialog = page.getByRole("dialog");
  for (const [index, target] of targets.entries()) {
    await expect(dialog).toContainText(`필사 사용 안내 · ${index + 1} / ${targets.length}`);
    await expect.poll(async () => {
      const box = await page.getByTestId("help-highlight").boundingBox();
      return !!box && box.height > 10;
    }).toBe(true);
    await expect(page.locator(`[data-transcription-help="${target}"]:visible`)).toHaveCount(1);
    await dialog.getByRole("button", { name: index === targets.length - 1 ? "안내 마치기" : "다음", exact: true }).click();
  }
  await expect(dialog).toHaveCount(0);
}

for (const width of [375, 1280]) {
  test(`필사 도움말과 안내 중 기록 보존 ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.addInitScript(() => localStorage.setItem("ritus:transcription", JSON.stringify({ source: "보존할 원문", text: "보존할 필사" })));
    await page.goto("/memo");
    await page.getByRole("button", { name: "필사", exact: true }).click();
    const before = await page.evaluate(() => localStorage.getItem("ritus:transcription"));
    await walkHelp(page, ["source", "content", "autosave", "edit", "restore", ...(width < 768 ? ["expand"] : [])]);
    expect(await page.evaluate(() => localStorage.getItem("ritus:transcription"))).toBe(before);
    if (width < 768) {
      await page.getByRole("button", { name: "화면 넓게" }).click();
      await walkHelp(page, ["source", "content", "autosave", "shrink"]);
      await page.getByRole("button", { name: "필사 도움말", exact: true }).click();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(page.getByRole("button", { name: "화면 줄이기" })).toBeVisible();
      expect(await page.evaluate(() => localStorage.getItem("ritus:transcription"))).toBe(before);
    }
  });
}

for (const size of ["normal", "large", "xlarge"]) {
  test(`모바일 ${size}에서 원문 도구·본문·입력란이 겹치지 않는다`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 640 });
    await page.goto("/memo");
    await page.evaluate(value => document.documentElement.dataset.textSize = value, size);
    await page.getByRole("button", { name: "필사", exact: true }).click();
    const source = page.getByLabel("필사 원문", { exact: true });
    const toolbar = await source.locator("div").first().boundingBox();
    const text = await source.locator("div").last().boundingBox();
    const input = await page.getByLabel("필사 입력", { exact: true }).boundingBox();
    expect(toolbar!.y + toolbar!.height).toBeLessThanOrEqual(text!.y + 1);
    expect(text!.height).toBeGreaterThanOrEqual(150);
    expect(text!.y + text!.height).toBeLessThanOrEqual(input!.y + 1);
    await page.getByRole("button", { name: "화면 넓게" }).click();
    await page.evaluate(() => {
      Object.defineProperty(window.visualViewport, "height", { value: 430, configurable: true });
      window.visualViewport!.dispatchEvent(new Event("resize"));
    });
    const expandedSource = await source.boundingBox();
    const expandedInput = await page.getByLabel("필사 입력", { exact: true }).boundingBox();
    expect(expandedSource!.height / expandedInput!.height).toBeCloseTo(1.5, 1);
    expect(expandedInput!.y + expandedInput!.height).toBeLessThanOrEqual(431);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("button", { name: "화면 줄이기" }).click();
    await source.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/transcription-${size}.png` });
  });
}
