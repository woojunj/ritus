import { defineConfig, devices } from "@playwright/test";

const port = 3100;
const baseURL = `http://localhost:${port}`;

// 서비스 워커는 배포된 앱에서만 등록하므로(app/_components/service-worker.tsx),
// 오프라인 테스트만 프로덕션 빌드를 띄워서 돌린다. 기본 e2e와 나눠 둔 이유도 이 빌드 시간 때문이다.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;

export default defineConfig({
  testDir: "./e2e-offline",
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: false,
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: executablePath ? { executablePath } : {},
      },
    },
  ],
  webServer: {
    command: `bun run build && bun run start -p ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 600_000,
  },
});
