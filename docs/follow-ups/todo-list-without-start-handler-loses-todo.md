# `TodoList`를 `onStartTimer` 없이 쓰면 할 일이 타이머로 전달되지 않음

**Symptom**: `TodoList`에 `onStartTimer`를 넘기지 않으면 카드가 `href="/"`로만 이동해 제목과 할 일 id가 세션에 전달되지 않고, 완주해도 완주 횟수가 오르지 않는다.

**Observed evidence**: 2026-10-10 `code-review low`가 [features/todo-list/components/todo-list.tsx](../../features/todo-list/components/todo-list.tsx)의 카드 링크에서 지적했다. 유일한 사용처인 `app/todos/page.tsx`는 prop을 넘기므로 실제 화면에서는 재현되지 않는다.

**Suspected cause**: 내비게이션 통일 작업(`docs/specs/unified-navigation/`)에서 `/?todoId=&title=` 주소 방식을 없애면서 prop이 없을 때의 대체 경로가 사라졌다. prop은 테스트 편의를 위해 선택 사항으로 남아 있다.

**What was tried**: 없음. 주 경로가 정상이라 고치지 않았다.

**Proposed next step**: `onStartTimer`를 필수 prop으로 바꾸고 `todo-list.test.tsx`가 prop을 넘기도록 고친다.
