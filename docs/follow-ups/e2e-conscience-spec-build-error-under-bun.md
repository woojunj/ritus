# 양심노트 e2e 파일이 bun으로 돌릴 때 구문 오류로 실행되지 않음

**Symptom**: `bun run test:e2e e2e/conscience-note.spec.ts`가 `BuildMessage: Unexpected !`를 내고 "No tests found"로 끝난다. 같은 방식으로 `e2e/memo-pad.spec.ts`, `e2e/todo-list.spec.ts`는 정상으로 돈다.

**Observed evidence**: 2026-10-11, Windows에서 node 없이 bun 1.3.6만 PATH에 두고 `PLAYWRIGHT_CHROMIUM_PATH`를 로컬 Chrome으로 지정해 실행했다. 내려받기·불러오기 작업의 변경을 stash로 뺀 `main` 상태의 파일에서도 똑같이 실패했다. 파일에서 `!`가 쓰인 곳은 `box!.x`, `box!.width`(84–85행)뿐이다.

**Suspected cause**: 확인하지 못했다. bun이 이 파일을 변환할 때 non-null 단언(`!`)에서 걸리는 것으로 보인다.

**What was tried**: 새로 더한 "모두 내려받은 파일을 빈 목록에 불러오면…" 테스트만 임시 파일로 떼어 돌렸고 통과했다. 파일 자체는 고치지 않았다.

**Proposed next step**: 84–85행의 `box!`를 `expect(box).not.toBeNull()` 뒤의 일반 접근으로 바꿔 보고, 파일 전체가 다시 도는지 확인한다.
