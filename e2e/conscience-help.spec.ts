import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 360, height: 780 }, { width: 1280, height: 900 }]) {
  test(`실제 양심노트 안내와 내용 보존 ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/conscience");
    const help = page.getByRole("button", { name: "양심노트 도움말", exact: true });
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await help.click();
    await expect(page.getByRole("heading", { name: "양심노트 시작하고 찾기" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(help).toBeFocused();
    await expect(page.getByText("양심노트를 쓰면 여기에 나타납니다")).toBeVisible();
    await page.getByRole("button", { name: "새 양심노트 쓰기", exact: true }).click();
    await page.getByRole("textbox", { name: "사안", exact: true }).fill("피곤해서 가족에게 거칠게 대답했다.");
    await page.getByRole("textbox", { name: "몰입", exact: true }).fill("잠시 멈추고 돌아본다.");
    await page.getByRole("group", { name: "몰입 신호", exact: true }).getByRole("button", { name: "찜자", exact: true }).click();
    const before = await page.evaluate(() => localStorage.getItem("ritus:conscience-notes"));
    await help.click();
    const dialog = page.getByRole("dialog");
    const titles = ["돌아볼 사안 하나 적기", "여섯 덕목으로 돌아보기", "지금 느끼는 신호 고르기", "도표에서 신호 살펴보기", "최종 결론과 작은 실천", "양심성찰 도우미에게 물어보기", "이 한 장을 글로 복사하기", "복사한 글을 양심노트에 붙여넣기", "이 한 장을 파일로 저장하기", "자동 저장과 완료"];
    for (let i = 0; i < titles.length; i++) {
      await expect(dialog.getByRole("heading", { name: titles[i] })).toBeVisible();
      await expect.poll(async () => {
        const rect = await page.getByTestId("note-help-highlight").boundingBox();
        const panel = await dialog.locator("div").first().boundingBox();
        const target = await page.locator(`[data-note-help="${["matter", "virtue", "signal", "chart", "conclusion", "helper", "copy", "paste", "download", "save"][i]}"]`).boundingBox();
        return !!rect && !!panel && !!target && rect.height >= target.height && rect.y >= 0 && rect.y + rect.height < panel.y && panel.y + panel.height <= viewport.height;
      }).toBe(true);
      if (i === 2) {
        await dialog.getByRole("button", { name: "이전", exact: true }).click();
        await expect(dialog.getByRole("heading", { name: titles[1] })).toBeVisible();
        await dialog.getByRole("button", { name: "다음", exact: true }).click();
      }
      if (i === 3) await page.screenshot({ path: `test-results/conscience-help-${viewport.width}.png` });
      await dialog.getByRole("button", { name: i === titles.length - 1 ? "안내 마치고 작성하기" : "다음", exact: true }).click();
    }
    await expect(dialog).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem("ritus:conscience-notes"))).toBe(before);
    await expect(page.getByRole("textbox", { name: "사안", exact: true })).toHaveValue("피곤해서 가족에게 거칠게 대답했다.");
    await expect(page.getByRole("group", { name: "몰입 신호", exact: true }).getByRole("button", { name: "찜자", exact: true })).toHaveAttribute("aria-pressed", "true");
    await help.click();
    await expect(dialog.getByRole("heading", { name: titles[0] })).toBeVisible();
    await dialog.getByRole("button", { name: "안내 닫기" }).click();
    await expect(help).toBeFocused();
    await page.getByRole("button", { name: "완료", exact: true }).click();
    await expect(page.getByText("피곤해서 가족에게 거칠게 대답했다.", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
