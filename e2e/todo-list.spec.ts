import { expect, test } from "@playwright/test";

test("내려받은 CSV를 빈 할 일 목록에 불러오면 할 일이 그대로 돌아온다", async ({ page }) => {
  await page.goto("/todos");
  await page.getByLabel("새 할 일").fill("글쓰기, 30분");
  await page.getByRole("button", { name: "할 일 추가" }).click();
  await page.getByLabel("새 할 일").fill("읽기");
  await page.getByRole("button", { name: "할 일 추가" }).click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "파일로 저장" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^ritus-todos-\d{8}\.csv$/);
  const path = await download.path();

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole("listitem")).toHaveCount(0);

  await page.getByLabel("할 일 불러오기 파일").setInputFiles(path);
  await expect(page.getByRole("listitem")).toHaveCount(2);
  await expect(page.getByRole("listitem").first()).toContainText("읽기");
  await expect(page.getByRole("listitem").last()).toContainText("글쓰기, 30분");
});
