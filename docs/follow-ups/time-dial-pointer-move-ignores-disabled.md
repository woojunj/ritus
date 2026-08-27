# TimeDial 드래그 중 disabled로 바뀌어도 값이 계속 바뀐다

**Symptom**: `TimeDial`의 `handlePointerMove`는 `handlePointerDown`·
`handleKeyDown`과 달리 `disabled` 상태를 확인하지 않는다. 드래그를 시작한
뒤 `disabled`가 `true`로 바뀌어도 `onChange`가 계속 호출되어 값이 바뀐다.

**Observed evidence**: `low` 강도 코드 리뷰(2026-08-27, 집중 세션 타이머
구현) 중 `features/focus-timer/components/time-dial.tsx`의
`handlePointerDown`(52행 부근)·`handleKeyDown`(69행 부근)에는 `if (disabled)
return;` 가드가 있는데 `handlePointerMove`(59행 부근)에는 같은 가드가 빠진
것을 diff에서 확인했다. `TimeDial`을 사용하는 유일한 호출부인
`setup-screen.tsx`는 `disabled`를 넘기지 않으므로 지금은 실제로 닿지 않는
경로다.

**Suspected cause**: `handlePointerMove`를 작성할 때 다른 두 핸들러에 있는
`disabled` 체크를 그대로 옮기지 않은 누락으로 보인다.

**What was tried**: 지금은 어떤 호출부도 `disabled`를 전달하지 않아 관찰
가능한 결함으로 이어지지 않으므로 고치지 않고 그대로 두었다.

**Proposed next step**: `TimeDial`에 `disabled`를 실제로 넘기는 호출부가
생기면(예: 세션 진행 중 다이얼을 잠그는 기능) `handlePointerMove` 시작부에
`if (disabled) return;`을 추가한다.
