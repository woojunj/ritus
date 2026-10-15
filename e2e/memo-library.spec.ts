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

test("저장한 메모를 낱말로 찾고, 목록을 떠나면 검색어가 지워진다", async ({ page }) => {
  await page.goto("/memo");
  const body = page.getByLabel("메모 본문");

  await body.fill("약속에 늦었다");
  await page.getByRole("button", { name: "메모 저장" }).click();
  await body.fill("회의 메모");
  await page.getByRole("button", { name: "메모 저장" }).click();

  await page.getByRole("button", { name: "저장한 메모 목록" }).click();
  await page.getByRole("button", { name: "저장한 메모 검색" }).click();
  const search = page.getByRole("searchbox", { name: "저장한 메모 검색" });
  await expect(search).toBeFocused();

  await search.fill("약속");
  await expect(page.getByRole("button", { name: '"약속에 늦었다" 불러오기' })).toBeVisible();
  await expect(page.getByRole("button", { name: '"회의 메모" 불러오기' })).toHaveCount(0);

  await search.fill("약속 회의");
  await expect(page.getByText("일치하는 메모가 없습니다")).toBeVisible();

  await page.getByRole("button", { name: "검색 닫기" }).click();
  await expect(page.getByRole("button", { name: '"회의 메모" 불러오기' })).toBeVisible();

  await page.getByRole("button", { name: "저장한 메모 검색" }).click();
  await page.getByRole("searchbox", { name: "저장한 메모 검색" }).fill("약속");
  await page.getByRole("button", { name: "편집으로 돌아가기" }).click();
  await page.getByRole("button", { name: "저장한 메모 목록" }).click();
  await expect(page.getByRole("searchbox", { name: "저장한 메모 검색" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: '"회의 메모" 불러오기' })).toBeVisible();
});

test("Ctrl+S를 누르면 글 칸에 커서가 있어도 지금 글이 저장 목록에 저장된다", async ({ page }) => {
  await page.goto("/memo");
  const body = page.getByLabel("메모 본문");
  await body.fill("단축키로 저장");
  await body.focus();
  await page.keyboard.press("Control+s");

  await expect(page.getByText("저장했습니다")).toBeVisible();
  await page.getByRole("button", { name: "저장한 메모 목록" }).click();
  await expect(page.getByRole("button", { name: '"단축키로 저장" 불러오기' })).toBeVisible();
});

test("목록을 보는 중에 /를 누르면 저장한 메모 검색 칸이 열린다", async ({ page }) => {
  await page.goto("/memo");
  const body = page.getByLabel("메모 본문");

  await body.fill("약속에 늦었다");
  await page.getByRole("button", { name: "메모 저장" }).click();
  await body.fill("회의 메모");
  await page.getByRole("button", { name: "메모 저장" }).click();

  await page.getByRole("button", { name: "저장한 메모 목록" }).click();
  await page.getByRole("button", { name: '"회의 메모" 불러오기' }).waitFor();
  await page.locator("body").focus();
  await page.keyboard.press("/");

  const search = page.getByRole("searchbox", { name: "저장한 메모 검색" });
  await expect(search).toBeFocused();
  await page.keyboard.type("약속");
  await expect(page.getByRole("button", { name: '"약속에 늦었다" 불러오기' })).toBeVisible();
  await expect(page.getByRole("button", { name: '"회의 메모" 불러오기' })).toHaveCount(0);

  // 검색 칸 안에서는 "/"가 글자로 쓰이고, 검색 칸을 다시 열지 않는다.
  await page.keyboard.type("/");
  await expect(search).toHaveValue("약속/");
});
