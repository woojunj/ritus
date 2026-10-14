import { expect, test, type Page } from "@playwright/test";

const KEYS = ["immersion", "love", "justice", "propriety", "sincerity", "wisdom"];

// 카드 버튼의 이름은 날짜로 시작한다. 삭제 버튼은 따옴표로 시작하므로 겹치지 않는다.
function card(page: Page, matter: string) {
  return page.getByRole("button", { name: new RegExp(`^\\d{4}년.*${matter}`) });
}

function empty() {
  return Object.fromEntries(KEYS.map((key) => [key, { text: "", level: null }]));
}

// 검색 테스트는 저장된 양심노트 두 장에서 시작한다. 쓰는 과정은 다른 테스트가 확인한다.
async function seedNotes(page: Page) {
  const notes = [
    {
      id: "late",
      date: "2026-10-13",
      matter: "약속에 늦었다",
      virtues: { ...empty(), immersion: { text: "서두르느라 깨어 있지 못했다", level: 2 } },
      conclusion: "미리 나선다",
      createdAt: 2,
    },
    {
      id: "interrupt",
      date: "2026-10-12",
      matter: "회의에서 말을 끊었다",
      virtues: { ...empty(), love: { text: "상대의 말을 끝까지 듣지 않았다", level: null } },
      conclusion: "먼저 사과한다",
      createdAt: 1,
    },
  ];
  await page.goto("/");
  await page.evaluate(
    (value) => localStorage.setItem("ritus:conscience-notes", value),
    JSON.stringify(notes)
  );
  await page.goto("/conscience");
}

test("돋보기를 누르면 검색 칸이 열리고, 낱말을 모두 포함한 장만 남는다", async ({ page }) => {
  await seedNotes(page);
  await expect(card(page, "회의에서 말을 끊었다")).toBeVisible();

  await page.getByRole("button", { name: "양심노트 검색" }).click();
  const search = page.getByRole("searchbox", { name: "양심노트 검색" });
  await expect(search).toBeFocused();

  await search.fill("약속 늦");
  await expect(card(page, "약속에 늦었다")).toBeVisible();
  await expect(card(page, "회의에서 말을 끊었다")).toHaveCount(0);
  await expect(page.getByText("사안", { exact: true })).toBeVisible();

  await search.fill("약속 사과");
  await expect(page.getByText("일치하는 양심노트가 없습니다")).toBeVisible();
});

test("일치한 칸 이름이 카드에 보이고, 지우면 전체 목록으로 돌아간다", async ({ page }) => {
  await seedNotes(page);
  await page.getByRole("button", { name: "양심노트 검색" }).click();
  const search = page.getByRole("searchbox", { name: "양심노트 검색" });

  await search.fill("서두르");
  await expect(card(page, "약속에 늦었다")).toContainText("몰입");

  await search.fill("");
  await expect(card(page, "회의에서 말을 끊었다")).toBeVisible();
  await expect(card(page, "약속에 늦었다")).toBeVisible();
});

test("닫기(×)를 누르면 검색 칸이 사라지고 목록이 원래대로 돌아간다", async ({ page }) => {
  await seedNotes(page);
  await page.getByRole("button", { name: "양심노트 검색" }).click();
  await page.getByRole("searchbox", { name: "양심노트 검색" }).fill("약속");
  await page.getByRole("button", { name: "검색 닫기" }).click();

  await expect(page.getByRole("searchbox", { name: "양심노트 검색" })).toHaveCount(0);
  await expect(card(page, "회의에서 말을 끊었다")).toBeVisible();
});

test("검색 중 한 장을 열면 검색어가 지워져, 돌아온 목록은 전체다", async ({ page }) => {
  await seedNotes(page);
  await page.getByRole("button", { name: "양심노트 검색" }).click();
  await page.getByRole("searchbox", { name: "양심노트 검색" }).fill("약속");
  await card(page, "약속에 늦었다").click();
  await expect(page.getByLabel("최종 결론")).toHaveValue("미리 나선다");

  await page.getByRole("button", { name: "완료" }).click();
  await expect(page.getByRole("searchbox", { name: "양심노트 검색" })).toHaveCount(0);
  await expect(card(page, "회의에서 말을 끊었다")).toBeVisible();
});

test("폰 너비에서 검색 칸이 열려도 가로 스크롤이 없다", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await seedNotes(page);
  await page.getByRole("button", { name: "양심노트 검색" }).click();
  await expect(page.getByRole("searchbox", { name: "양심노트 검색" })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("신호 칩으로 거르고, 검색어와 함께 쓰면 두 조건을 모두 만족하는 장만 남는다", async ({ page }) => {
  await seedNotes(page);
  await page.getByRole("button", { name: "양심노트 검색" }).click();
  const group = page.getByRole("group", { name: "신호로 거르기" });
  const chip = group.getByRole("button", { name: "자찜 신호로 거르기" });

  await chip.click();
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  await expect(card(page, "약속에 늦었다")).toBeVisible();
  await expect(card(page, "회의에서 말을 끊었다")).toHaveCount(0);

  await page.getByRole("searchbox", { name: "양심노트 검색" }).fill("회의");
  await expect(page.getByText("일치하는 양심노트가 없습니다")).toBeVisible();

  await chip.click();
  await expect(chip).toHaveAttribute("aria-pressed", "false");
  await expect(card(page, "회의에서 말을 끊었다")).toBeVisible();
  await expect(card(page, "약속에 늦었다")).toHaveCount(0);
});

test("닫기(×)를 누르면 신호 칩도 함께 지워진다", async ({ page }) => {
  await seedNotes(page);
  await page.getByRole("button", { name: "양심노트 검색" }).click();
  await page.getByRole("group", { name: "신호로 거르기" }).getByRole("button", { name: "자찜 신호로 거르기" }).click();
  await page.getByRole("button", { name: "검색 닫기" }).click();

  await page.getByRole("button", { name: "양심노트 검색" }).click();
  await expect(
    page.getByRole("group", { name: "신호로 거르기" }).getByRole("button", { name: "자찜 신호로 거르기" })
  ).toHaveAttribute("aria-pressed", "false");
  await expect(card(page, "회의에서 말을 끊었다")).toBeVisible();
});
