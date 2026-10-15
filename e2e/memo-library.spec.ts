import { expect, test } from "@playwright/test";

test("메모를 저장하고, 저장한 메모를 불러오면 지금 글이 임시 보관된다", async ({ page }) => {
  await page.goto("/memo");
  const body = page.getByLabel("메모 본문");

  await body.fill("첫 메모");
  await page.getByRole("button", { name: "메모 저장" }).click();
  await expect(page.getByText("저장했습니다")).toBeVisible();

  await page.getByRole("button", { name: "저장한 메모 목록" }).click();
  await expect(page.getByRole("button", { name: '"첫 메모" 불러오기' })).toBeVisible();
  await page.getByRole("button", { name: "편집으로 돌아가기" }).click();

  await body.fill("둘째 메모");
  await page.getByRole("button", { name: "저장한 메모 목록" }).click();
  await page.getByRole("button", { name: '"첫 메모" 불러오기' }).click();
  await expect(page.getByRole("alertdialog")).toContainText("임시 보관");
  await page.getByRole("button", { name: "확인" }).click();

  await expect(body).toHaveValue("첫 메모");
  await page.getByRole("button", { name: "저장한 메모 목록" }).click();
  await expect(page.getByRole("button", { name: '"둘째 메모" 불러오기' })).toBeVisible();
  await expect(page.getByText("임시 보관", { exact: true })).toBeVisible();
});

test("빈 글은 저장하지 않고 그렇게 알린다", async ({ page }) => {
  await page.goto("/memo");
  await page.getByRole("button", { name: "메모 저장" }).click();
  await expect(page.getByText("저장할 글이 없습니다")).toBeVisible();
});

test("저장한 메모를 지우면 확인을 거친 뒤 목록에서 사라진다", async ({ page }) => {
  await page.goto("/memo");
  await page.getByLabel("메모 본문").fill("지울 메모");
  await page.getByRole("button", { name: "메모 저장" }).click();
  await page.getByRole("button", { name: "저장한 메모 목록" }).click();

  await page.getByRole("button", { name: '"지울 메모" 삭제' }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "삭제" }).click();
  await expect(page.getByText("저장한 메모가 여기에 나타납니다")).toBeVisible();
});
