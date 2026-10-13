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
    .getByRole("group", { name: "사랑 신호" })
    .getByRole("button", { name: "찜자" })
    .click();
  await page
    .getByRole("group", { name: "정의 신호" })
    .getByRole("button", { name: "자명" })
    .click();
  await page.getByLabel("최종 결론").fill("먼저 사과한다");

  const chart = page.getByRole("img", { name: /여섯 덕목 도표/ });
  await expect(chart).toHaveAttribute("aria-label", /사랑 찜자, 정의 자명/);
  await expect(chart.locator("circle[data-virtue]")).toHaveCount(2);
  // 두 점이 같은 가로선 위에 있어 높이가 0이므로 보이는지 대신 있는지를 확인한다.
  await expect(chart.locator("polygon")).toHaveAttribute("points", "90,0 -30,0");

  await page.reload();
  await page.getByRole("button", { name: /회의에서 말을 끊었다$/ }).click();
  await expect(page.getByLabel("최종 결론")).toHaveValue("먼저 사과한다");
  await expect(
    page.getByRole("group", { name: "정의 신호" }).getByRole("button", { name: "자명" })
  ).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "완료" }).click();
  await expect(page.getByTestId("note-chart")).toBeVisible();
  await page.getByRole("button", { name: '"회의에서 말을 끊었다" 삭제' }).click();
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
    .getByRole("group", { name: "지혜 신호" })
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

  // 목록 위의 아이콘 다섯 개도 한 줄에 들어온다.
  await page.getByRole("button", { name: "완료" }).click();
  const helper = await page.getByRole("link", { name: "양심성찰 도우미 열기" }).boundingBox();
  const create = await page.getByRole("button", { name: "새 양심노트 쓰기" }).boundingBox();
  expect(helper!.y).toBe(create!.y);
  expect(create!.x + create!.width).toBeLessThanOrEqual(360);
  await expect(page.getByRole("button", { name: "모두 파일로 저장" })).toBeVisible();
});

test("복사한 한 장과 다른 곳에서 쓴 글을 붙여넣으면 양식에 채워진다", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/conscience");
  await page.getByRole("button", { name: "새 양심노트 쓰기" }).click();
  await page.getByLabel("사안", { exact: true }).fill("약속에 늦었다");
  await page.getByRole("group", { name: "성실 신호" }).getByRole("button", { name: "찜자" }).click();
  await page.getByRole("button", { name: "클립보드로 복사" }).click();
  await expect(page.getByRole("button", { name: "복사됨" })).toBeVisible();
  await page.getByRole("button", { name: "양심노트 삭제" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "확인" }).click();
  await expect(page.getByRole("listitem")).toHaveCount(0);

  // 이 앱에서 복사한 한 장은 그대로 돌아와 바로 열린다.
  await page.getByRole("button", { name: "클립보드에서 붙여넣기" }).click();
  await expect(page.getByLabel("사안", { exact: true })).toHaveValue("약속에 늦었다");
  await expect(
    page.getByRole("group", { name: "성실 신호" }).getByRole("button", { name: "찜자" })
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "완료" }).click();

  // 다른 메모장에서 쓴 글도 덕목 이름을 따라 나눠 담긴다.
  await page.evaluate(() =>
    navigator.clipboard.writeText(
      "회의에서 말을 끊었다\n\n사랑 (찜찜)\n끝까지 듣지 않았다\n결론: 먼저 사과한다"
    )
  );
  await page.getByRole("button", { name: "클립보드에서 붙여넣기" }).click();
  await expect(page.getByLabel("사안", { exact: true })).toHaveValue("회의에서 말을 끊었다");
  await expect(page.getByLabel("사랑", { exact: true })).toHaveValue("끝까지 듣지 않았다");
  await expect(
    page.getByRole("group", { name: "사랑 신호" }).getByRole("button", { name: "찜찜" })
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("최종 결론")).toHaveValue("먼저 사과한다");
  await page.getByRole("button", { name: "완료" }).click();
  await expect(page.getByRole("listitem")).toHaveCount(2);

  // 같은 글을 다시 붙여넣으면 더하지 않고 까닭을 알린다.
  await page.getByRole("button", { name: "클립보드에서 붙여넣기" }).click();
  await expect(page.getByText("이미 같은 양심노트가 있습니다")).toBeVisible();
  await expect(page.getByRole("listitem")).toHaveCount(2);
});

test("한 장에서 붙여넣으면 빈 칸은 채우고 쓴 글 아래에 이어 붙인다", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/conscience");
  await page.getByRole("button", { name: "새 양심노트 쓰기" }).click();
  await page.getByLabel("사안", { exact: true }).fill("회의에서 말을 끊었다");
  await page.getByRole("group", { name: "사랑 신호" }).getByRole("button", { name: "자명" }).click();

  await page.evaluate(() =>
    navigator.clipboard.writeText(
      "상대가 말을 멈췄다\n\n사랑 (찜찜)\n끝까지 듣지 않았다\n결론: 먼저 사과한다"
    )
  );
  await page.getByRole("button", { name: "클립보드에서 붙여넣기" }).click();

  await expect(page.getByLabel("사안", { exact: true })).toHaveValue(
    "회의에서 말을 끊었다\n\n상대가 말을 멈췄다"
  );
  await expect(page.getByLabel("사랑", { exact: true })).toHaveValue("끝까지 듣지 않았다");
  await expect(
    page.getByRole("group", { name: "사랑 신호" }).getByRole("button", { name: "자명" })
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("최종 결론")).toHaveValue("먼저 사과한다");

  // 여러 장이 든 글은 한 장에 섞지 않고 목록에서 붙여넣으라고 알린다.
  const twoNotes =
    "양심노트 2026년 10월 1일\n\n[사안]\n약속에 늦었다\n\n\n양심노트 2026년 10월 2일\n\n[사안]\n화를 냈다";
  await page.evaluate((text) => navigator.clipboard.writeText(text), twoNotes);
  await page.getByRole("button", { name: "클립보드에서 붙여넣기" }).click();
  await expect(page.getByText("여러 장은 목록에서 붙여넣어 주세요")).toBeVisible();
  await expect(page.getByLabel("사안", { exact: true })).toHaveValue(
    "회의에서 말을 끊었다\n\n상대가 말을 멈췄다"
  );

  // 새 한 장이 생기지 않고 열려 있던 한 장에만 더해진다.
  await page.getByRole("button", { name: "완료" }).click();
  await expect(page.getByRole("listitem")).toHaveCount(1);

  // 목록에서는 같은 글이 장마다 새 한 장이 된다.
  await page.getByRole("button", { name: "클립보드에서 붙여넣기" }).click();
  await expect(page.getByRole("listitem")).toHaveCount(3);
});

test("브라우저가 클립보드 읽기를 막으면 직접 붙여넣는 창으로 이어 간다", async ({ page }) => {
  await page.addInitScript(() => {
    navigator.clipboard.readText = () =>
      Promise.reject(new DOMException("denied", "NotAllowedError"));
  });
  await page.goto("/conscience");

  await page.getByRole("button", { name: "클립보드에서 붙여넣기" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("브라우저가 클립보드 읽기를 허용하지 않아");
  await expect(dialog.getByRole("button", { name: "양식에 채우기" })).toBeDisabled();

  await dialog.getByLabel("붙여넣을 글").fill("약속에 늦었다\n[성실] 찜자\n미리 나서지 않았다");
  await dialog.getByRole("button", { name: "양식에 채우기" }).click();

  await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel("사안", { exact: true })).toHaveValue("약속에 늦었다");
  await expect(page.getByLabel("성실", { exact: true })).toHaveValue("미리 나서지 않았다");
  await expect(
    page.getByRole("group", { name: "성실 신호" }).getByRole("button", { name: "찜자" })
  ).toHaveAttribute("aria-pressed", "true");
});

test("모두 내려받은 파일을 빈 목록에 불러오면 한 장이 그대로 돌아온다", async ({ page }) => {
  await page.goto("/conscience");
  await page.getByRole("button", { name: "새 양심노트 쓰기" }).click();
  await page.getByLabel("사안", { exact: true }).fill("약속에 늦었다");
  await page.getByLabel("성실", { exact: true }).fill("미리 나서지 않았다");
  await page.getByRole("group", { name: "성실 신호" }).getByRole("button", { name: "찜자" }).click();
  await page.getByRole("button", { name: "완료" }).click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "모두 파일로 저장" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^ritus-conscience-all-\d{8}\.txt$/);
  const path = await download.path();

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole("listitem")).toHaveCount(0);

  await page.getByLabel("양심노트 불러오기 파일").setInputFiles(path);
  await expect(page.getByRole("listitem")).toHaveCount(1);
  await page.getByRole("listitem").getByRole("button").first().click();
  await expect(page.getByLabel("사안", { exact: true })).toHaveValue("약속에 늦었다");
  await expect(page.getByLabel("성실", { exact: true })).toHaveValue("미리 나서지 않았다");
  await expect(
    page.getByRole("group", { name: "성실 신호" }).getByRole("button", { name: "찜자" })
  ).toHaveAttribute("aria-pressed", "true");
});
