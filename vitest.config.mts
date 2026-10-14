import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // tsconfig.json의 "@/*" 경로 별칭을 Vite가 직접 해석한다.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    passWithNoTests: true,
    // 화면 전체를 그리는 테스트는 전체 실행의 부하에서 기본 5초를 넘기곤 한다.
    testTimeout: 15_000,
    // 워커마다 jsdom을 띄워서, 코어 수만큼 늘리면 메모리 8GB 기기에서 여유
    // 메모리가 바닥나 테스트가 수십 초씩 멈춘다.
    maxWorkers: 4,
    exclude: [
      "node_modules/**",
      ".next/**",
      "e2e/**",
      ".claude/worktrees/**",
    ],
  },
});
