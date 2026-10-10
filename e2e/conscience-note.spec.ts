import { expect, test } from "@playwright/test";

test("양심노트를 쓰면 도표가 그려지고, 새로고침해도 남아 있으며, 지울 수 있다", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "양심노트" }).click();
  await expect(page).toHaveURL(/\/conscience$/);
  await expect(page.getByRole("link", { name: "양심노트" })).toHaveAttribute(
    "aria-current",
    "page"
  );
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/conscience$/);

  await page.getByRole("button", { name: "새 양심노트 쓰기" }).click();
  await expect(page.getByLabel("사안")).toBeFocused();
  await page.getByLabel("사안").fill("회의에서 말을 끊었다");
  await page.getByLabel("사랑", { exact: true }).fill("상대의 말을 끝까지 듣지 않았다");
  await page
    .getByRole("group", { name: "사랑 단계" })
    .getByRole("button", { name: "찜자" })
    .click();
  await page
    .getByRole("group", { name: "정의 단계" })
    .getByRole("button", { name: "자명" })
    .click();
  await page.getByLabel("최종 결론").fill("먼저 사과한다");

  const chart = page.getByRole("img", { name: /여섯 덕목 도표/ });
  await expect(chart).toHaveAttribute("aria-label", /사랑 찜자, 정의 자명/);
  await expect(chart.locator("circle[data-virtue]")).toHaveCount(2);
  // 두 점이 같은 가로선 위에 있어 높이가 0이므로 보이는지 대신 있는지를 확인한다.
  await expect(chart.locator("polygon")).toHaveAttribute("points", "90,0 -30,0");

  await page.reload();
  await page.getByRole("button", { name: /회의에서 말을 끊었다/ }).click();
  await expect(page.getByLabel("최종 결론")).toHaveValue("먼저 사과한다");
  await expect(
    page.getByRole("group", { name: "정의 단계" }).getByRole("button", { name: "자명" })
  ).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "양심노트 삭제" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "확인" }).click();
  await expect(page.getByRole("listitem")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("listitem")).toHaveCount(0);
});

test("세션 중에 양심노트로 가도 시간이 이어지고 한 줄 바로 조작한다", async ({ page }) => {
  await page.clock.install();
  await page.goto("/conscience");
  await expect(page.getByRole("timer")).toHaveCount(0);

  await page.getByRole("link", { name: "타이머" }).click();
  await page.getByRole("button", { name: "시작" }).click();
  await page.getByRole("link", { name: "양심노트" }).click();
  await page.clock.fastForward(10_000);
  await expect(page.getByRole("timer")).toHaveText(/^24:(50|4\d)$/);
  await page.getByRole("button", { name: "일시정지" }).click();
  await expect(page.getByRole("button", { name: "이어서" })).toBeVisible();
});

test("폰 너비에서 양심노트 한 장이 가로 스크롤 없이 세로로 이어진다", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/conscience");
  await page.getByRole("button", { name: "새 양심노트 쓰기" }).click();
  await page
    .getByRole("group", { name: "지혜 단계" })
    .getByRole("button", { name: "자명" })
    .click();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);
  const chart = page.getByRole("img", { name: /여섯 덕목 도표/ });
  await chart.scrollIntoViewIfNeeded();
  const box = await chart.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(360);
});
