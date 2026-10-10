import { expect, test } from "@playwright/test";

test("폰 너비에서 메모장이 가로 스크롤 없이 한 화면에 들어오고 편집/프리뷰를 전환한다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/memo");

  const body = page.getByLabel("메모 본문");
  await body.fill("# 제목\n\n본문");
  await expect(page.getByTestId("memo-status")).toBeInViewport();
  await expect(page.getByRole("link", { name: "타이머" })).toBeInViewport();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);

  await page.getByRole("tab", { name: "md" }).click();
  const preview = page.getByTestId("memo-preview");
  await expect(preview).toBeHidden();

  await page.getByRole("button", { name: "프리뷰 보기" }).click();
  await expect(preview.getByRole("heading", { name: "제목" })).toBeVisible();
  await expect(body).toBeHidden();

  await page.getByRole("button", { name: "편집하기" }).click();
  await expect(body).toBeVisible();
});

test("저장 버튼은 선택한 형식의 파일을 내려받는다", async ({ page }) => {
  await page.goto("/memo");
  await page.getByLabel("메모 본문").fill("백업");
  await page.getByRole("tab", { name: "md" }).click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "파일로 저장" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^ritus-memo-\d{8}\.md$/);
});
