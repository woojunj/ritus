import { expect, test } from "@playwright/test";

test("첫 방문에 5초 동안 도움말을 알리고 재방문에는 반복하지 않는다", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.clock.install();
  await page.goto("/");
  const ring = page.getByTestId("help-discovery-ring");
  await expect(ring).toBeVisible();
  await expect(ring).toHaveCSS("animation-name", "help-discovery-breathe");
  await page.screenshot({ path: "test-results/help-discovery-mobile.png" });
  await page.clock.fastForward(5100);
  await expect(ring).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("button", { name: "타이머 도움말", exact: true })).toBeVisible();
  await expect(ring).toHaveCount(0);
  await page.goto("/conscience");
  await expect(ring).toBeVisible();
});

test("도움말을 열면 원이 즉시 사라지고 닫아도 다시 나타나지 않는다", async ({ page }) => {
  await page.goto("/");
  const ring = page.getByTestId("help-discovery-ring");
  await expect(ring).toBeVisible();
  await page.getByRole("button", { name: "타이머 도움말", exact: true }).click();
  await expect(ring).toHaveCount(0);
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(ring).toHaveCount(0);
});

test("동작 줄이기에서는 원을 움직이지 않는다", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const ring = page.getByTestId("help-discovery-ring");
  await expect(ring).toBeVisible();
  await expect(ring).toHaveCSS("animation-name", "none");
  await expect(ring).toHaveCSS("transform", "none");
});

test("개발 미리보기에서는 첫 표시 기록이 있어도 다시 재생한다", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await page.goto("/");
  const ring = page.getByTestId("help-discovery-ring");
  await expect(ring).toBeVisible();
  await page.clock.fastForward(5100);
  await expect(ring).toHaveCount(0);
  await page.goto("/?help-preview=1");
  await expect(ring).toBeVisible();
  await expect(ring).toHaveCSS("animation-name", "help-discovery-breathe");
  await expect(ring).toHaveCSS("opacity", "1");
  await page.clock.fastForward(5100);
  await expect(ring).toHaveCount(0);
  await page.reload();
  await expect(ring).toBeVisible();
});

test("다크 테마에서도 밝은 원이 크기를 바꾸며 숨쉰다", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/dark/);
  const ring = page.getByTestId("help-discovery-ring");
  await expect(ring).toBeVisible();
  await ring.evaluate(element => {
    const animation = element.getAnimations()[0];
    animation.pause();
    animation.currentTime = 0;
  });
  await expect(ring).toHaveCSS("transform", "matrix(0.5, 0, 0, 0.5, 0, 0)");
  await expect(ring).toHaveCSS("opacity", "1");
  const small = await ring.boundingBox();
  await page.screenshot({ path: "test-results/help-discovery-dark-small.png" });
  await ring.evaluate(element => { element.getAnimations()[0].currentTime = 5000 / 3 / 2; });
  await expect(ring).toHaveCSS("transform", "matrix(1.1, 0, 0, 1.1, 0, 0)");
  await expect(ring).toHaveCSS("opacity", "1");
  const large = await ring.boundingBox();
  expect(large!.width / small!.width).toBeCloseTo(1.1 / 0.5, 1);
  console.log(`도움말 원의 실제 지름: ${small!.width.toFixed(1)}px → ${large!.width.toFixed(1)}px`);
  await page.screenshot({ path: "test-results/help-discovery-dark.png" });
});
