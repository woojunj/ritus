import { expect, test } from "@playwright/test";

test("세션 중에 세 화면을 오가도 시간이 이어지고, 메모장은 뒤로가기와 새로고침이 된다", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page.getByLabel("세션 제목").fill("결제 모듈 리팩터링");
  await page.getByRole("button", { name: "시작" }).click();

  await page.getByRole("link", { name: "메모장" }).click();
  await expect(page).toHaveURL(/\/memo$/);
  await expect(page.getByRole("link", { name: "메모장" })).toHaveAttribute(
    "aria-current",
    "page"
  );
  await page.getByLabel("메모 본문").fill("세션 중 메모");
  await page.clock.fastForward(10_000);
  // 화면 이동에 걸린 실제 시간만큼 더 줄 수 있어 범위로 확인한다.
  await expect(page.getByRole("timer")).toHaveText(/^24:(50|4\d)$/);

  await page.getByRole("link", { name: "할 일 목록" }).click();
  await expect(page).toHaveURL(/\/todos$/);
  await page.clock.fastForward(10_000);
  await expect(page.getByRole("timer")).toHaveText(/^24:(40|3\d)$/);

  await page.getByRole("button", { name: "일시정지" }).click();
  const pausedAt = (await page.getByRole("timer").textContent()) ?? "";
  await expect(page).toHaveTitle(`${pausedAt} · 결제 모듈 리팩터링`);
  await page.goBack();
  await expect(page).toHaveURL(/\/memo$/);
  await expect(page.getByRole("button", { name: "이어서" })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("timer")).toHaveText(pausedAt);
  await expect(page.getByText("결제 모듈 리팩터링")).toBeVisible();

  await page.goto("/memo");
  await page.reload();
  await expect(page).toHaveURL(/\/memo$/);
  await expect(page.getByLabel("메모 본문")).toHaveValue("세션 중 메모");
});

test("세션 중에 다른 할 일을 누르면 확인을 받는다", async ({ page }) => {
  await page.goto("/todos");
  await page.getByLabel("새 할 일").fill("보고서 초안");
  await page.getByRole("button", { name: "할 일 추가" }).click();
  await page.getByLabel("새 할 일").fill("알고리즘 문제 풀이");
  await page.getByRole("button", { name: "할 일 추가" }).click();

  await page.getByRole("link", { name: '"보고서 초안" 타이머 시작' }).click();
  await expect(page.getByLabel("세션 제목")).toHaveValue("보고서 초안");
  await page.getByRole("button", { name: "시작" }).click();

  await page.getByRole("link", { name: "할 일 목록" }).click();
  await page
    .getByRole("link", { name: '"알고리즘 문제 풀이" 타이머 시작' })
    .click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("지금 세션을 그만두고 새로 시작할까요?");

  await dialog.getByRole("button", { name: "취소" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "일시정지" })).toBeVisible();

  await page
    .getByRole("link", { name: '"알고리즘 문제 풀이" 타이머 시작' })
    .click();
  await page.getByRole("alertdialog").getByRole("button", { name: "확인" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByLabel("세션 제목")).toHaveValue("알고리즘 문제 풀이");
  await expect(page.getByRole("button", { name: "시작" })).toBeVisible();
});

test("폰 너비에서 세 화면의 헤더가 가로 스크롤 없이 한 줄에 들어온다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  for (const path of ["/", "/memo", "/todos"]) {
    await page.goto(path);
    const header = page.getByRole("banner");
    await expect(header.getByRole("link", { name: "타이머" })).toBeInViewport();
    await expect(header.getByRole("button", { name: "소리 끄기" })).toBeInViewport();
    expect((await header.boundingBox())?.height).toBeLessThan(60);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  }
});
