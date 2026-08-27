import { expect, test } from "@playwright/test";

test("홈 화면이 열리고 집중 세션 타이머 설정 화면이 보인다", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle("집중 세션 타이머");
  await expect(page.getByRole("button", { name: "시작" })).toBeVisible();
});
