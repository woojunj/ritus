import { expect, test } from "@playwright/test";

test("전체를 한 파일로 저장하고, 그 파일로 세 화면의 내용을 되살린다", async ({ page }) => {
  await page.goto("/todos");
  await page.getByLabel("새 할 일").fill("글쓰기");
  await page.getByRole("button", { name: "할 일 추가" }).click();
  await page.goto("/memo");
  await page.getByLabel("메모 본문").fill("오늘 할 것");
  await page.goto("/conscience");
  await page.getByRole("button", { name: "새 양심노트 쓰기" }).click();
  await page.getByLabel("사안", { exact: true }).fill("약속에 늦었다");
  await page.getByRole("button", { name: "완료" }).click();

  await page.getByRole("button", { name: "전체 백업" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("alertdialog").getByRole("button", { name: "전체 저장" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^ritus-backup-\d{8}\.json$/);
  const path = await download.path();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);

  // 백업한 뒤에 내용이 달라진다.
  await page.getByRole("button", { name: /"약속에 늦었다" 삭제/ }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "확인" }).click();
  await expect(page.getByRole("listitem")).toHaveCount(0);
  await page.goto("/memo");
  await expect(page.getByLabel("메모 본문")).toHaveValue("오늘 할 것");
  await page.getByLabel("메모 본문").fill("다른 글");

  // ritus 백업 파일이 아니면 받지 않는다.
  await page.getByRole("button", { name: "전체 백업" }).click();
  const dialog = page.getByRole("alertdialog");
  await page.getByLabel("백업 파일").setInputFiles({
    name: "memo.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"hello":1}'),
  });
  await expect(dialog.getByRole("alert")).toHaveText("ritus 백업 파일이 아닙니다");

  // 무엇이 바뀌는지 보여 주고, 확인하면 보고 있던 화면에 바로 나타난다.
  await page.getByLabel("백업 파일").setInputFiles(path);
  await expect(dialog).toContainText("지금 내용은 사라지고 백업 파일의 내용으로 바뀝니다.");
  await expect(dialog).toContainText("양심노트 0장, 할 일 1개, 메모 4자");
  await expect(dialog).toContainText("양심노트 1장, 할 일 1개, 메모 6자");
  await dialog.getByRole("button", { name: "바꾸기" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel("메모 본문")).toHaveValue("오늘 할 것");

  await page.goto("/conscience");
  await expect(page.getByRole("listitem")).toContainText("약속에 늦었다");
  await page.goto("/todos");
  await expect(page.getByRole("listitem")).toContainText("글쓰기");
});
