import { expect, test } from "@playwright/test";

// 시계를 멈춘 채 세션을 시작해, 테스트가 느리게 돌아도 fastForward로 보낸
// 시간만 흐르게 한다. pauseAt은 앞으로만 갈 수 있어 설치 시각보다 뒤로 둔다.
const CLOCK_START = new Date("2026-01-01T09:00:00");
const SESSION_START = new Date("2026-01-01T10:00:00");

test("설정부터 종료·재시작까지 세션 흐름이 이어진다", async ({ page }) => {
  await page.clock.install({ time: CLOCK_START });
  await page.goto("/");

  await page.getByLabel("세션 제목").fill("결제 모듈 리팩터링");
  await page.getByLabel("시간(분)").fill("1");
  await page.clock.pauseAt(SESSION_START);
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
    endScreen.getByText(/잘 마치셨습니다|애쓰셨습니다|오늘도 한 걸음|충분합니다|깊이 머문 시간|잠시 쉬어 가세요|이제 쉬셔도 좋습니다|고요/)
  ).toBeVisible();

  await endScreen.click({ position: { x: 5, y: 5 } });
  await expect(endScreen).toHaveAttribute("data-blinking", "false");

  await page.getByRole("button", { name: "다시 시작" }).click();
  await expect(page.getByRole("timer")).toHaveText("01:00");
  await expect(page.getByText("결제 모듈 리팩터링")).toBeVisible();
});

test("종료 화면의 새로 정하기로 설정 화면에 돌아가 제목과 시간을 바꿔 시작할 수 있다", async ({
  page,
}) => {
  await page.clock.install({ time: CLOCK_START });
  await page.goto("/");

  await page.getByLabel("세션 제목").fill("결제 모듈 리팩터링");
  await page.getByLabel("시간(분)").fill("1");
  await page.clock.pauseAt(SESSION_START);
  await page.getByRole("button", { name: "시작" }).click();
  await page.clock.fastForward(60_000);

  const endScreen = page.getByTestId("end-screen");
  await expect(endScreen).toBeVisible();
  await endScreen.getByRole("button", { name: "새로 정하기" }).click();

  await expect(endScreen).toHaveCount(0);
  await expect(page.getByLabel("세션 제목")).toHaveValue("결제 모듈 리팩터링");
  await page.getByLabel("세션 제목").fill("다음 글");
  await page.getByLabel("시간(분)").fill("2");
  await page.getByRole("button", { name: "시작" }).click();

  await expect(page.getByRole("timer")).toHaveText("02:00");
  await expect(page.getByText("다음 글")).toBeVisible();
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
    page.getByText(/잘 마치셨습니다|애쓰셨습니다|오늘도 한 걸음|충분합니다|깊이 머문 시간|잠시 쉬어 가세요|이제 쉬셔도 좋습니다|고요/)
  ).toHaveCount(0);
});

test("두 구간 반복이 총 시간을 넘겨 진행 중인 사이클을 채우고 끝난다", async ({
  page,
}) => {
  await page.clock.install({ time: CLOCK_START });
  await page.goto("/");

  await page.getByLabel("시간(분)").fill("1");
  await page.getByRole("button", { name: "번갈아 반복" }).click();
  // 구간 설정은 좁은 화면용과 넓은 화면용 두 자리에 그려지고, 데스크톱 폭에서는 넓은 쪽만 보인다.
  const fields = page.getByTestId("interval-fields-wide");
  await fields.getByLabel("첫 구간(초)").fill("30");
  await fields.getByLabel("두 번째 구간(초)").fill("20");
  await page.clock.pauseAt(SESSION_START);
  await page.getByRole("button", { name: "시작" }).click();

  const indicator = page.getByTestId("slice-indicator");
  await expect(indicator).toContainText("구간 1");

  // 첫 구간(30초)이 끝나면 두 번째 구간으로 바뀐다.
  await page.clock.fastForward(30_000);
  await expect(indicator).toContainText("구간 2");

  // 총 시간(60초)에 닿아도 진행 중인 사이클(50~100초)을 채우느라 끝나지 않는다.
  await page.clock.fastForward(30_000);
  await expect(page.getByTestId("end-screen")).toHaveCount(0);
  await expect(indicator).toContainText("구간 1");

  // 첫 구간이 끝나도(80초) 두 번째 구간까지 마저 돈다.
  await page.clock.fastForward(20_000);
  await expect(page.getByTestId("end-screen")).toHaveCount(0);
  await expect(indicator).toContainText("구간 2");

  // 사이클을 다 채운 100초에 실제로 끝난다.
  await page.clock.fastForward(20_000);
  await expect(page.getByTestId("end-screen")).toBeVisible();
});

test("설정 화면에서 아무 데도 포커스가 없을 때 Space로 시작하고, 입력 칸에서는 글자로 쓰인다", async ({ page }) => {
  await page.clock.install({ time: CLOCK_START });
  await page.goto("/");

  const minutes = page.getByLabel("시간(분)");
  await minutes.fill("1");
  // 입력 칸에서 Space는 글자로 쓰이고 세션을 시작하지 않는다.
  await minutes.focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("timer")).toHaveCount(0);

  // 빈 곳을 눌러 포커스를 풀면 Space가 시작한다.
  await page.locator("body").click({ position: { x: 4, y: 4 } });
  await page.clock.pauseAt(SESSION_START);
  await page.keyboard.press("Space");
  await expect(page.getByRole("timer")).toHaveText("01:00");
});

test("세션 중 포커스가 없을 때 Space로 일시정지하고 다시 누르면 이어 간다", async ({ page }) => {
  await page.clock.install({ time: CLOCK_START });
  await page.goto("/");
  await page.getByLabel("시간(분)").fill("1");
  await page.clock.pauseAt(SESSION_START);
  await page.locator("body").click({ position: { x: 4, y: 4 } });
  await page.keyboard.press("Space");

  const clock = page.getByRole("timer");
  await expect(clock).toHaveText("01:00");
  await page.clock.fastForward(5_000);
  await page.locator("body").click({ position: { x: 4, y: 4 } });
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "이어서" })).toBeVisible();

  const pausedText = await clock.textContent();
  await page.clock.fastForward(10_000);
  await expect(clock).toHaveText(pausedText ?? "");

  await page.locator("body").click({ position: { x: 4, y: 4 } });
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "일시정지" })).toBeVisible();
});

test("완료 화면에서 포커스가 없을 때 Space로 같은 설정을 다시 시작한다", async ({ page }) => {
  await page.clock.install({ time: CLOCK_START });
  await page.goto("/");
  await page.getByLabel("세션 제목").fill("결제 모듈 리팩터링");
  await page.getByLabel("시간(분)").fill("1");
  await page.clock.pauseAt(SESSION_START);
  await page.getByRole("button", { name: "시작" }).click();
  await page.clock.fastForward(60_000);

  await expect(page.getByTestId("end-screen")).toBeVisible();
  await page.locator("body").click({ position: { x: 4, y: 4 } });
  await page.keyboard.press("Space");

  await expect(page.getByTestId("end-screen")).toHaveCount(0);
  await expect(page.getByRole("timer")).toHaveText("01:00");
  await expect(page.getByText("결제 모듈 리팩터링")).toBeVisible();
});
