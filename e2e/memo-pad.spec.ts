import { readFile } from "node:fs/promises";

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

  // 폰의 파일 보기가 한글을 깨뜨리지 않도록 UTF-8 BOM으로 시작한다.
  const path = await download.path();
  const bytes = await readFile(path);
  expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  expect(bytes.subarray(3).toString("utf8")).toBe("백업");

  // 다시 불러오면 BOM 없이 글만 돌아온다.
  await page.getByLabel("메모 본문").fill("");
  await page.getByLabel("파일 불러오기 파일").setInputFiles(path);
  await expect(page.getByLabel("메모 본문")).toHaveValue("백업");
});

test("복사 버튼을 누르면 메모가 클립보드에 담긴다", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/memo");

  await page.getByLabel("메모 본문").fill("복사할 글");
  await page.getByRole("button", { name: "클립보드로 복사" }).click();

  await expect(page.getByRole("button", { name: "복사됨" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("복사할 글");
});

test("파일을 불러오면 쓰던 글을 바꿀지 묻고, 확인하면 바뀐다", async ({ page }) => {
  await page.goto("/memo");
  await page.getByLabel("메모 본문").fill("쓰던 글");

  await page.getByLabel("파일 불러오기 파일").setInputFiles({
    name: "note.md",
    mimeType: "text/markdown",
    buffer: Buffer.from("# 불러온 글"),
  });
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("쓰던 글을 불러온 파일로 바꿀까요?");
  await dialog.getByRole("button", { name: "확인" }).click();

  await expect(page.getByLabel("메모 본문")).toHaveValue("# 불러온 글");
  await expect(page.getByRole("tab", { name: "md" })).toHaveAttribute("aria-selected", "true");
});

test("저장된 글이 나타나기 전에 쓴 글이 저장된 글과 섞이지 않는다", async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("ritus:memo")) {
      localStorage.setItem("ritus:memo", JSON.stringify({ text: "저장된 글", format: "txt" }));
    }
  });
  // 스크립트를 붙잡아 저장된 글이 아직 들어오지 않은 빈 화면을 만든다.
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  // 스타일까지 붙잡으면 화면 자체가 그려지지 않으므로 스크립트만 붙잡는다.
  await page.route(/\/_next\/static\/.*\.js(\?|$)/, async (route) => {
    await held;
    await route.continue();
  });
  await page.goto("/memo", { waitUntil: "commit" });
  const body = page.getByLabel("메모 본문");

  await expect(body).toHaveValue("");
  await expect(body).not.toBeEditable();
  await body.click();
  await page.keyboard.type("abc");
  release();

  await expect(body).toBeEditable();
  await expect(body).toHaveValue("저장된 글");
  await body.fill("새 글");
  await expect(body).toHaveValue("새 글");
});
