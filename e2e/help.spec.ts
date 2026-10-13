import { expect, test } from "@playwright/test";

test("도움말 아이콘을 누르면 매뉴얼이 서식대로 보이고 문서 안의 링크로 절을 오간다", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "도움말" }).click();
  // 개발 서버가 이 화면을 처음 만들 때는 시간이 더 걸린다.
  await expect(page).toHaveURL(/\/help$/, { timeout: 20_000 });
  await expect(page.getByRole("link", { name: "도움말" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { level: 1, name: "ritus 사용법" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "양심노트" })).toBeVisible();

  const backup = page.getByRole("heading", { level: 2, name: "전체 백업" });
  await expect(backup).not.toBeInViewport();
  await page.getByRole("article").getByRole("link", { name: "전체 백업" }).click();
  await expect(backup).toBeInViewport();
});

test("세션 중에 도움말을 열어도 세션이 이어지고, 폰 너비에서 가로 스크롤이 없다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/");
  await page.getByRole("button", { name: "시작" }).click();
  await page.getByRole("link", { name: "도움말" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "ritus 사용법" })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole("timer")).toHaveText(/^2[45]:\d\d$/);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
