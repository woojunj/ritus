import { expect, test } from "@playwright/test";

test("저장 위치 안내를 먼저 보여 주고 확인 후 설치를 안내한다", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const notice = page.getByRole("complementary", { name: "저장 위치 안내" });
  await expect(notice).toContainText("지금 브라우저에만 저장돼요");
  await expect(page.getByRole("complementary", { name: "앱 설치 안내" })).toHaveCount(0);
  await page.screenshot({ path: "test-results/storage-notice.png" });
  await notice.getByRole("button", { name: "자세히" }).click();
  await expect(page.getByRole("alertdialog")).toContainText("백업 파일 다운로드도 제한");
  await expect(page.getByRole("alertdialog")).toContainText("전체 백업 → 불러오기");
  await page.getByRole("alertdialog").getByRole("button", { name: "확인", exact: true }).click();
  await expect(notice).toHaveCount(0);
  await expect(page.getByRole("complementary", { name: "앱 설치 안내" })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("ritus:storage-notice-confirmed:v1"))).toBe("yes");
});

test("설치 안내 닫기와 도움말에서 다시 열기", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  await page.getByRole("complementary", { name: "저장 위치 안내" }).getByRole("button", { name: "확인", exact: true }).click();
  const banner = page.getByRole("complementary", { name: "앱 설치 안내" });
  await expect(banner).toBeVisible();
  await page.screenshot({ path: "test-results/install-banner.png" });
  await banner.getByRole("button", { name: "설치 안내", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toContainText("Chrome·Edge");
  await page.getByRole("button", { name: "닫기", exact: true }).click();
  await banner.getByRole("button", { name: "나중에" }).click();
  await expect(banner).toHaveCount(0);
  await expect(page.getByTestId("install-reminder")).toContainText("도움말 → 앱 설치 안내");
  const help = await page.locator('[data-header-help="manual"]').boundingBox();
  await expect(page.getByTestId("install-help-highlight")).toHaveAttribute("x", String(help!.x - 4));
  await page.screenshot({ path: "test-results/install-reminder.png" });
  await expect(page.getByTestId("install-reminder")).toHaveCount(0, { timeout: 6000 });
  await page.reload();
  await page.getByRole("complementary", { name: "저장 위치 안내" }).getByRole("button", { name: "확인", exact: true }).click();
  // 개발 미리보기에서는 닫았어도 새로고침하면 다시 표시한다.
  await expect(banner).toBeVisible();
  await page.goto("/help");
  await page.getByRole("button", { name: "앱 설치 안내", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("아이폰은 공유 메뉴를 안내하고 설치된 앱에서는 배너를 숨긴다", async ({ browser }) => {
  const context = await browser.newContext({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1", viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByRole("complementary", { name: "저장 위치 안내" }).getByRole("button", { name: "확인", exact: true }).click();
  await page.getByRole("button", { name: "설치 안내", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toContainText("공유 버튼");
  await expect(page.getByRole("alertdialog")).toContainText("전체 백업");
  await page.screenshot({ path: "test-results/install-iphone.png" });
  await page.addInitScript(() => Object.defineProperty(navigator, "standalone", { value: true }));
  await page.reload();
  await expect(page.getByRole("complementary", { name: "앱 설치 안내" })).toHaveCount(0);
  await context.close();
});

test("브라우저 설치 이벤트가 있을 때만 직접 설치를 제공한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("complementary", { name: "저장 위치 안내" }).getByRole("button", { name: "확인", exact: true }).click();
  await expect(page.getByRole("complementary", { name: "앱 설치 안내" })).toBeVisible();
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(event, { prompt: async () => ({ outcome: "accepted" }) });
    window.dispatchEvent(event);
  });
  await page.getByRole("button", { name: "앱 설치", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect(page.getByRole("complementary", { name: "앱 설치 안내" })).toHaveCount(0);
});
