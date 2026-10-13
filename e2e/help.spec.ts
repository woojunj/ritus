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

  // 아이콘을 누르는 설명에는 이름 앞에 그 아이콘이 보이고, 자리 표시는 글로 새지 않는다.
  const article = page.getByRole("article");
  await expect(
    article.getByRole("listitem").filter({ hasText: "글 전체를 클립보드에 담습니다" }).locator("svg")
  ).toBeVisible();
  await expect(article).not.toContainText("아이콘:");

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

test("도움말에서 도우미에게 보낼 글을 복사해, 채워진 글을 양심노트에 붙여넣는다", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/help");
  const clipboard = () => page.evaluate(() => navigator.clipboard.readText());

  await page.getByRole("button", { name: "양식 복사", exact: true }).click();
  await expect(page.getByRole("button", { name: "복사됨" })).toBeVisible();
  const plain = await clipboard();
  expect(plain).toContain("양식에 맞춰 정리해 주세요");
  expect(plain).toContain("[사안]");
  expect(plain).toContain("[최종 결론]");
  expect(plain).not.toContain("판단");

  await page.getByRole("button", { name: "양식과 신호 판단 복사" }).click();
  const withSignals = await clipboard();
  expect(withSignals).toContain("찜찜, 찜자, 자찜, 자명 중 하나를 판단해서");

  // 도우미가 양식을 채워 돌려준 것처럼 만들어 목록에 붙여넣는다.
  const filled = withSignals
    .replace("[사안]", "[사안]\n약속에 늦었다")
    .replace("[성실]", "[성실] 찜자\n미리 나서지 않았다");
  await page.evaluate((text) => navigator.clipboard.writeText(text), filled);
  await page.getByRole("link", { name: "양심노트", exact: true }).click();
  await page.getByRole("button", { name: "클립보드에서 붙여넣기" }).click();

  await page.getByText("약속에 늦었다").click();
  await expect(page.getByLabel("사안")).toHaveValue("약속에 늦었다");
  await expect(
    page.getByRole("group", { name: "성실 신호" }).getByRole("button", { name: "찜자" })
  ).toHaveAttribute("aria-pressed", "true");
});
