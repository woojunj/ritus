import { expect, test } from "@playwright/test";

const SCREENS = ["/", "/timer", "/memo", "/todos", "/conscience", "/help"];

// 서비스 워커는 설치 때 화면을 미리 받고, 다 받은 뒤에야 화면을 제어하기 시작한다.
// 그래서 controller가 생겼다는 것은 오프라인에서 쓸 화면이 모두 준비됐다는 뜻이다.
async function waitForOfflineReady(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, {
    timeout: 60_000,
  });
}

test("한 번 연 뒤 네트워크를 끊어도 모든 화면을 새로고침해서 열 수 있다", async ({
  page,
  context,
}) => {
  await waitForOfflineReady(page);
  await context.setOffline(true);

  for (const path of SCREENS) {
    await page.goto(path);
    await expect(page.getByRole("link", { name: "타이머" })).toBeVisible();
  }

  await page.goto("/help");
  await expect(page.getByRole("heading", { level: 1, name: "ritus 사용법" })).toBeVisible();
});

test("네트워크가 끊긴 채 헤더 아이콘으로 화면을 오갈 수 있다", async ({ page, context }) => {
  await waitForOfflineReady(page);
  await context.setOffline(true);

  await page.getByRole("link", { name: "메모장" }).click();
  await expect(page).toHaveURL(/\/memo$/);
  await page.getByRole("link", { name: "양심노트" }).click();
  await expect(page).toHaveURL(/\/conscience$/);
  await page.getByRole("link", { name: "타이머" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("네트워크가 끊긴 채 쓴 메모는 새로고침한 뒤에도 남는다", async ({ page, context }) => {
  await waitForOfflineReady(page);
  await context.setOffline(true);

  await page.goto("/memo");
  await page.getByLabel("메모 본문").fill("오프라인에서 쓴 글");
  await page.waitForFunction(() =>
    Object.values(localStorage).some((value) => value.includes("오프라인에서 쓴 글"))
  );

  await page.reload();
  await expect(page.getByLabel("메모 본문")).toHaveValue("오프라인에서 쓴 글");
});

test("네트워크가 끊긴 채 세션을 시작하면 남은 시간이 줄어든다", async ({ page, context }) => {
  await waitForOfflineReady(page);
  await context.setOffline(true);

  await page.goto("/");
  await page.getByRole("button", { name: "시작" }).click();
  const timer = page.getByRole("timer");
  await expect(timer).toHaveText(/^2[45]:\d\d$/);
  const before = await timer.textContent();
  await page.waitForTimeout(2500);
  await expect(timer).not.toHaveText(before ?? "");
});
