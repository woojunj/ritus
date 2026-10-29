import { expect, test } from "@playwright/test";

for (const width of [360, 1280]) {
  test(`상단 버튼 안내는 설정과 자료를 바꾸지 않는다 ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/help");
    await page.evaluate(() => localStorage.setItem("ritus:todos", JSON.stringify([{ id: "test", title: "보관할 일", completionCount: 2, completed: true, createdAt: 1 }])));
    const before = await page.evaluate(() => JSON.stringify(localStorage));
    await page.getByRole("button", { name: "상단 버튼 안내 시작" }).click();
    const dialog = page.getByRole("dialog");
    for (const [index, target] of ["navigation", "manual", "backup", "theme", "size", "sound"].entries()) {
      await expect(dialog).toContainText(`상단 버튼 사용 안내 · ${index + 1} / 6`);
      const rect = await page.locator(`[data-header-help="${target}"]`).boundingBox();
      expect(rect).not.toBeNull();
      const highlight = dialog.getByTestId("help-highlight");
      await expect.poll(async () => Number(await highlight.getAttribute("width"))).toBeGreaterThan(20);
      await expect.poll(async () => Math.abs(Number(await highlight.getAttribute("y")) - Math.max(8, rect!.y - 6))).toBeLessThan(2);
      if (index === 5) await page.screenshot({ path: `test-results/header-help-${width}.png` });
      await dialog.getByRole("button", { name: index === 5 ? "안내 마치기" : "다음", exact: true }).click();
    }
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("button", { name: "상단 버튼 안내 시작" })).toBeFocused();
    expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(before);
    await page.getByRole("button", { name: "상단 버튼 안내 시작" }).click();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  });
}
