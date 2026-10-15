import { expect, test } from "@playwright/test";

// 글자를 크게 보면 메모 도구 아이콘이 화면 밖으로 밀려나 저장과 불러오기가 안 보였다.
// 좁은 폰에서 가장 큰 글자로 열어도 모든 도구가 화면 안에 있어야 한다.
test("가장 큰 글자와 폰 너비에서도 메모 저장과 불러오기 버튼이 화면 안에 보인다", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/memo");
  await page.evaluate(() => document.documentElement.setAttribute("data-text-size", "xlarge"));

  const viewport = page.viewportSize();
  for (const name of ["파일로 저장", "파일 불러오기", "클립보드로 복사"]) {
    const box = await page.getByRole("button", { name }).boundingBox();
    expect(box, name).not.toBeNull();
    expect(box!.x + box!.width, name).toBeLessThanOrEqual(viewport!.width);
    expect(box!.x, name).toBeGreaterThanOrEqual(0);
  }
});
