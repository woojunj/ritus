import { expect, test } from "@playwright/test";

test("홈 화면이 열리고 집중 세션 타이머 설정 화면이 보인다", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle("집중");
  await expect(page.getByRole("button", { name: "시작" })).toBeVisible();
});

test("아이콘만 있는 버튼과 링크에 마우스를 올리면 보이는 이름이 있다", async ({ page }) => {
  await page.goto("/");

  // 헤더와 타이머 설정 화면의 아이콘 버튼·링크는 글자가 보이지 않으므로 모두 title이 있어야 한다.
  const untitled = await page
    .locator("header a, header button, main button")
    .evaluateAll((elements) =>
      elements
        .filter((element) => !element.getAttribute("title"))
        .filter((element) => {
          const visibleText = [...element.childNodes]
            .filter((node) => !(node instanceof Element && node.classList.contains("sr-only")))
            .map((node) => node.textContent ?? "")
            .join("")
            .trim();
          return visibleText === "";
        })
        .map((element) => element.outerHTML.slice(0, 120))
    );
  expect(untitled).toEqual([]);
  await expect(page.getByRole("link", { name: "메모장" })).toHaveAttribute("title", "메모장");
});
