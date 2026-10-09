# e2e의 두 구간 반복 테스트가 옛 토글 이름을 찾다가 시간 초과로 실패

**Symptom**: `e2e/focus-timer.spec.ts`의 "두 구간 반복이 총 시간을 넘겨 진행 중인 구간을 채우고 끝난다" 테스트가 `getByRole('button', { name: '구간 반복' })`를 30초 동안 찾지 못해 실패한다.

**Observed evidence**: `feat/memo-pad` 브랜치에서 `PLAYWRIGHT_CHROMIUM_PATH`를 로컬 Chrome으로 지정하고 `bunx playwright test`를 실행했을 때(dev 서버 http://localhost:3000 재사용) 6개 중 이 테스트만 실패했다. 토글의 접근성 이름은 [features/focus-timer/components/interval-toggle.tsx:36](../../features/focus-timer/components/interval-toggle.tsx#L36)에서 "번갈아 반복"이다.

**Suspected cause**: 커밋 `eba4179`(아이콘 기반 UI, `docs/specs/icon-minimal-ui/`)에서 토글 이름을 "구간 반복"에서 "번갈아 반복"으로 바꿨지만 e2e는 갱신하지 않았다.

**What was tried**: 없음. 메모장 작업 범위 밖이라 원인만 확인했다.

**Proposed next step**: `e2e/focus-timer.spec.ts:77`의 버튼 이름을 "번갈아 반복"으로 바꾸고, 같은 테스트의 구간 라벨("첫 구간(초)" 등)도 현재 UI와 맞는지 확인한 뒤 e2e를 다시 돌린다.
