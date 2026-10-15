import { expect, test, type Page } from "@playwright/test";

// 할 일 카드는 타이머를 시작하는 링크다. 이름에 시작 문구가 붙는다.
function todo(page: Page, title: string) {
  return page.getByRole("link", { name: new RegExp(`"${title}" 타이머 시작`) });
}

// 검색 테스트는 저장된 할 일 세 개에서 시작한다. 추가하는 과정은 다른 테스트가 확인한다.
async function seedTodos(page: Page) {
  const todos = [
    { id: "a", title: "글쓰기 초안", completionCount: 0, createdAt: 3 },
    { id: "b", title: "운동 20분", completionCount: 1, createdAt: 2 },
    { id: "c", title: "글쓰기 교정", completionCount: 0, createdAt: 1 },
  ];
  await page.goto("/");
  await page.evaluate(
    (value) => localStorage.setItem("ritus:todos", value),
    JSON.stringify(todos)
  );
  await page.goto("/todos");
}

test("돋보기를 누르면 검색 칸이 열리고, 낱말을 모두 포함한 할 일만 남는다", async ({ page }) => {
  await seedTodos(page);
  await expect(todo(page, "운동 20분")).toBeVisible();

  await page.getByRole("button", { name: "할 일 검색" }).click();
  const search = page.getByRole("searchbox", { name: "할 일 검색" });
  await expect(search).toBeFocused();

  await search.fill("글쓰기 교정");
  await expect(todo(page, "글쓰기 교정")).toBeVisible();
  await expect(todo(page, "글쓰기 초안")).toHaveCount(0);
  await expect(todo(page, "운동 20분")).toHaveCount(0);

  await search.fill("운동 교정");
  await expect(page.getByText("일치하는 할 일이 없습니다")).toBeVisible();
});

test("/를 누르면 검색 칸이 열리고 커서가 그 칸으로 간다", async ({ page }) => {
  await seedTodos(page);
  await expect(todo(page, "운동 20분")).toBeVisible();

  await page.keyboard.press("/");
  const search = page.getByRole("searchbox", { name: "할 일 검색" });
  await expect(search).toBeFocused();

  await page.keyboard.type("운동");
  await expect(todo(page, "운동 20분")).toBeVisible();
  await expect(todo(page, "글쓰기 초안")).toHaveCount(0);
});

test("닫기(×)를 누르면 검색 칸이 사라지고 전체 목록이 돌아온다", async ({ page }) => {
  await seedTodos(page);
  await page.getByRole("button", { name: "할 일 검색" }).click();
  await page.getByRole("searchbox", { name: "할 일 검색" }).fill("운동");
  await page.getByRole("button", { name: "검색 닫기" }).click();

  await expect(page.getByRole("searchbox", { name: "할 일 검색" })).toHaveCount(0);
  await expect(todo(page, "글쓰기 초안")).toBeVisible();
  await expect(todo(page, "운동 20분")).toBeVisible();
});

test("폰 너비에서 검색 칸이 열려도 가로 스크롤이 없다", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await seedTodos(page);
  await page.getByRole("button", { name: "할 일 검색" }).click();
  await expect(page.getByRole("searchbox", { name: "할 일 검색" })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
