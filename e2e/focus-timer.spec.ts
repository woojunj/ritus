import { expect, test } from "@playwright/test";

test("설정부터 종료·재시작까지 세션 흐름이 이어진다", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");

  await page.getByLabel("세션 제목").fill("결제 모듈 리팩터링");
  await page.getByLabel("시간(분)").fill("1");
  await page.getByRole("button", { name: "시작" }).click();

  const clock = page.getByRole("timer");
  await expect(clock).toHaveText("01:00");
  await expect(page).toHaveTitle("01:00 · 결제 모듈 리팩터링");

  const ring = page.getByTestId("progress-ring-value");
  const circumference = Number(
    await ring.getAttribute("data-circumference")
  );
  await expect
    .poll(async () => Number(await ring.getAttribute("stroke-dashoffset")))
    .toBeCloseTo(0, 1);

  await page.clock.fastForward(10_000);
  await expect(clock).toHaveText("00:50");
  // 50/60이 남았으니 링의 1/6만큼 비어야 한다(반대 방향으로 채워진 게 아니라
  // 시간이 줄수록 링도 함께 줄어드는지 확인).
  await expect
    .poll(async () => Number(await ring.getAttribute("stroke-dashoffset")))
    .toBeCloseTo(circumference / 6, 1);

  await page.getByRole("button", { name: "일시정지" }).click();
  const pausedText = await clock.textContent();
  await page.clock.fastForward(5_000);
  await expect(clock).toHaveText(pausedText ?? "");

  await page.getByRole("button", { name: "이어서" }).click();
  await page.clock.fastForward(60_000);

  const endScreen = page.getByTestId("end-screen");
  await expect(endScreen).toHaveAttribute("data-blinking", "true");
  await expect(
    endScreen.getByText(/고생했다|수고했다|잘 했다|오늘도 해냈다|충분히 잘하고 있다/)
  ).toBeVisible();

  await endScreen.click({ position: { x: 5, y: 5 } });
  await expect(endScreen).toHaveAttribute("data-blinking", "false");

  await page.getByRole("button", { name: "다시 시작" }).click();
  await expect(page.getByRole("timer")).toHaveText("01:00");
  await expect(page.getByText("결제 모듈 리팩터링")).toBeVisible();
});

test("세션 도중 그만두면 메시지 없이 처음 화면으로 돌아간다", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByLabel("세션 제목").fill("결제 모듈 리팩터링");
  await page.getByRole("button", { name: "시작" }).click();
  await expect(page.getByRole("timer")).toBeVisible();

  await page.getByRole("button", { name: "그만두기" }).click();

  await expect(page.getByRole("button", { name: "시작" })).toBeVisible();
  await expect(
    page.getByText(/고생했다|수고했다|잘 했다|오늘도 해냈다|충분히 잘하고 있다/)
  ).toHaveCount(0);
});

test("두 구간 반복이 총 시간을 넘겨 진행 중인 구간을 채우고 끝난다", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");

  await page.getByLabel("시간(분)").fill("1");
  await page.getByRole("button", { name: "구간 반복" }).click();
  await page.getByLabel("첫 구간(초)").fill("30");
  await page.getByLabel("두 번째 구간(초)").fill("20");
  await page.getByRole("button", { name: "시작" }).click();

  const indicator = page.getByTestId("slice-indicator");
  await expect(indicator).toContainText("구간 1");

  // 첫 구간(30초)이 끝나면 두 번째 구간으로 바뀐다.
  await page.clock.fastForward(30_000);
  await expect(indicator).toContainText("구간 2");

  // 총 시간(60초)에 닿아도 진행 중인 첫 구간(50~80초)을 채우느라 끝나지 않는다.
  await page.clock.fastForward(30_000);
  await expect(page.getByTestId("end-screen")).toHaveCount(0);
  await expect(indicator).toContainText("구간 1");

  // 80초에 실제로 끝난다.
  await page.clock.fastForward(20_000);
  await expect(page.getByTestId("end-screen")).toBeVisible();
});
