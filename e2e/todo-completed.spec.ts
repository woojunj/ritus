import { expect, test } from "@playwright/test";

for (const width of [360, 1280]) {
  test(`완료 체크는 삭제와 별개로 저장되고 키보드 선택에서 제외된다 ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/todos");
    await page.evaluate(() => localStorage.setItem("ritus:todos", JSON.stringify([
      { id: "a", title: "책 읽기", completed: true, completionCount: 2, createdAt: 3 },
      { id: "b", title: "회의 정리", completionCount: 0, createdAt: 2 },
      { id: "c", title: "산책", completed: false, completionCount: 0, createdAt: 1 },
    ])));
    await page.reload();
    const check = page.getByRole("checkbox", { name: '"책 읽기" 완료', exact: true });
    const link = page.getByRole("link", { name: '"책 읽기" 타이머 시작', exact: true });
    await expect(check).toBeChecked();
    await expect(link).toHaveAttribute("aria-disabled", "true");
    await link.click({ force: true });
    await expect(page).toHaveURL(/\/todos$/);
    await expect(page.getByRole("listitem")).toHaveCount(3);
    await page.locator("body").click({ position: { x: 4, y: 4 } });
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Space");
    await expect(page.getByLabel("세션 제목")).toHaveValue("회의 정리");
    await page.goto("/todos");
    await check.uncheck();
    await expect(link).toHaveAttribute("aria-disabled", "false");
    await expect(page.getByLabel("완주 2회")).toBeVisible();
    await page.reload();
    await expect(check).not.toBeChecked();
    await check.check();
    await page.reload();
    await expect(check).toBeChecked();
    await page.screenshot({ path: `test-results/todo-completed-${width}.png` });
    await check.uncheck();
    await link.click();
    await expect(page.getByLabel("세션 제목")).toHaveValue("책 읽기");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("체크 상태를 CSV로 되살리고 이전 CSV도 미체크로 불러온다", async ({ page }) => {
  await page.goto("/todos");
  await page.getByLabel("새 할 일").fill("새로 체크한 일");
  await page.getByRole("button", { name: "할 일 추가", exact: true }).click();
  await page.getByRole("checkbox").check();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "파일로 저장", exact: true }).click();
  const file = await downloading;
  const path = await file.path();
  await page.evaluate(() => localStorage.removeItem("ritus:todos"));
  await page.reload();
  await page.getByLabel("할 일 불러오기 파일").setInputFiles(path!);
  await expect(page.getByRole("checkbox", { name: '"새로 체크한 일" 완료', exact: true })).toBeChecked();
  await page.getByLabel("할 일 불러오기 파일").setInputFiles({
    name: "legacy.csv", mimeType: "text/csv", buffer: Buffer.from("할 일,완주 횟수\n예전 할 일,3", "utf8"),
  });
  await expect(page.getByRole("checkbox", { name: '"예전 할 일" 완료', exact: true })).not.toBeChecked();
  await expect(page.getByLabel("완주 3회")).toBeVisible();
});
