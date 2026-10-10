# 저장소가 막힌 브라우저에서 양심노트와 할 일 목록 화면이 무한 재렌더로 죽을 수 있음

**Symptom**: `localStorage.getItem`이 매번 예외를 던지는 환경(저장소 차단)에서 `/conscience`와 `/todos`가 "Maximum update depth exceeded"로 죽을 수 있다.

**Observed evidence**: 실행해서 재현하지는 않았다. `code-review low`가 코드에서 지적했다. [features/conscience-note/lib/storage.ts](../../features/conscience-note/lib/storage.ts)의 `getNotesSnapshot`과 [features/todo-list/lib/storage.ts](../../features/todo-list/lib/storage.ts)의 `getTodosSnapshot`은 `catch`에서 매번 새 `[]`를 돌려주고, 두 화면은 이 값을 `useSyncExternalStore`의 스냅샷으로 쓴다.

**Suspected cause**: 스냅샷 참조가 호출마다 달라져 React가 저장소가 계속 바뀐다고 본다.

**What was tried**: 없음. 스펙이 요구하지 않은 엣지케이스라 양심노트 작업에서는 고치지 않았다.

**Proposed next step**: 두 함수의 `catch`에서 `SERVER_EMPTY` 같은 고정 참조를 돌려준다.
