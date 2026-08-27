# 종료 화면에서 "새로 정한다" 경로가 없음

**Symptom**: 세션이 끝나 격려 문구가 뜬 뒤, 같은 설정으로 "다시 시작"만 할 수 있고 설정 화면으로 돌아가 제목·시간을 새로 정할 방법이 없다.

**Observed evidence**: 사용자가 로컬 프리뷰(`bun dev`, http://localhost:3000)에서 1분 세션을 끝까지 실행해 종료 화면("오늘도 해냈다" 등)을 본 뒤 확인. 코드상으로도 [features/focus-timer/focus-timer.tsx:189-197](../../features/focus-timer/focus-timer.tsx#L189-L197)의 `EndScreen`에는 `onRestart={handleStart}`만 연결되어 있고, 설정 화면(`phase: "setup"`)으로 되돌리는 `handleQuit`은 전달되지 않는다.

**Suspected cause**: `EndScreen` 컴포넌트와 `focus-timer.tsx`의 배선 자체가 "같은 설정으로 다시 시작" 경로만 구현하고, `PRODUCT.md`의 Core loop가 명시한 "새로 정한다" 경로 구현이 누락됐다.

**What was tried**: 없음. 원인만 코드로 확인했고 수정은 하지 않았다.

**Proposed next step**: `EndScreen`에 설정 화면으로 돌아가는 버튼(예: `onNewSession`)을 추가하고 `focus-timer.tsx`에서 `handleQuit`을 연결한다. `shape-idea`로 버튼 문구·배치를 먼저 정하는 편이 낫다.
