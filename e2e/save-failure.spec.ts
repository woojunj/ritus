import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith("ritus:") && document.documentElement.dataset.allowStorageWrites !== "true") {
        throw new DOMException("테스트용 저장 차단", "QuotaExceededError");
      }
      return original.call(this, key, value);
    };
  });
});

test("저장 실패한 네 종류의 데이터를 화면 이동 후에도 백업하고 다시 저장한다", async ({ page }) => {
  await page.goto("/memo");
  await page.getByLabel("메모 본문").fill("저장하지 못한 메모");
  const warning = page.getByRole("alert").filter({ hasText: "이 브라우저에 저장하지 못했습니다" });
  await expect(warning).toContainText("이 브라우저에 저장하지 못했습니다");
  await expect(page.getByRole("status")).toHaveText("저장하지 못함");
  await warning.getByRole("button", { name: "저장 실패 안내 닫기" }).click();
  await expect(warning).toHaveCount(0);
  await expect(page.getByText("저장되지 않은 변경이 있습니다", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "저장 실패 안내 보기" }).click();
  await expect(warning).toBeVisible();
  await page.getByRole("button", { name: "메모 저장", exact: true }).click();
  await expect(page.getByText("저장했습니다", { exact: true })).toHaveCount(0);

  // 앱 안에서 화면을 옮기는 동안 저장하지 못한 내용을 유지한다.
  await page.getByRole("link", { name: "할 일 목록", exact: true }).click();
  await page.getByLabel("새 할 일").fill("저장하지 못한 할 일");
  await page.getByRole("button", { name: "할 일 추가" }).click();
  await expect(page.getByRole("listitem")).toContainText("저장하지 못한 할 일");
  await page.getByRole("link", { name: "양심노트", exact: true }).click();
  await page.getByRole("button", { name: "새 양심노트 쓰기" }).click();
  await page.getByLabel("사안", { exact: true }).fill("저장하지 못한 사안");
  await expect(page.getByRole("status")).toHaveText("저장하지 못함");
  await page.getByRole("link", { name: "도움말", exact: true }).click();
  await expect(warning).toBeVisible();

  const downloading = page.waitForEvent("download");
  await warning.getByRole("button", { name: "파일로 백업" }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toMatch(/^ritus-backup-\d{8}\.json$/);
  const backup = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(backup.memo.text).toBe("저장하지 못한 메모");
  expect(backup.memoLibrary.saved[0].text).toBe("저장하지 못한 메모");
  expect(backup.todos[0].title).toBe("저장하지 못한 할 일");
  expect(backup.conscienceNotes[0].matter).toBe("저장하지 못한 사안");
  await expect(warning).toBeVisible();

  await warning.getByRole("button", { name: "다시 저장" }).click();
  await expect(warning).toBeVisible();
  await page.evaluate(() => { document.documentElement.dataset.allowStorageWrites = "true"; });
  await warning.getByRole("button", { name: "다시 저장" }).click();
  await expect(warning).toHaveCount(0);
  await page.reload();
  await page.getByRole("link", { name: "메모장", exact: true }).click();
  await expect(page.getByLabel("메모 본문")).toHaveValue("저장하지 못한 메모");
  await expect(page.getByRole("status")).toHaveText("자동 저장됨");
  // 다시 실패하면 이전의 접힌 상태를 이어받지 않고 큰 안내를 연다.
  await page.getByLabel("메모 본문").fill("다시 저장이 막힌 글");
  await expect(warning).toBeVisible();
});

test("폰 너비에서도 저장 실패 안내와 백업·재시도 버튼이 화면 안에 들어온다", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/memo");
  await page.getByLabel("메모 본문").fill("첫 저장부터 실패한 글");
  await expect(page.getByLabel("메모 본문")).toHaveValue("첫 저장부터 실패한 글");
  await expect(page.getByRole("alert").getByRole("button", { name: "파일로 백업" })).toBeInViewport();
  await expect(page.getByRole("alert").getByRole("button", { name: "다시 저장" })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});
