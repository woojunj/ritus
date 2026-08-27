# 구간 길이 상한·하한(3초~3600초)이 세 곳에 중복 정의되어 있다

**Symptom**: 구간 하나의 길이 제약(3초 이상, 3600초 이하)이 `lib/time.ts`의
`clampIntervalSeconds`(및 그 안의 `MIN_INTERVAL_SECONDS`·
`MAX_INTERVAL_SECONDS`) 외에도 `components/interval-dial.tsx`의
`MIN_SECONDS`·`MAX_SECONDS`, `components/interval-settings.tsx`의
`<Input min={3} max={3600}>`에 각각 리터럴로 다시 적혀 있다.

**Observed evidence**: `low` 강도 코드 리뷰(2026-08-27, 두 구간 반복 엔진
구현) 중 세 파일에서 같은 3/3600 값을 발견했다.

**Suspected cause**: `IntervalDial`을 `Dial`의 얇은 래퍼로 만들면서 다이얼의
min/max와, `SecondsField`의 `<Input>` min/max를 실제 클램프 로직
(`clampIntervalSeconds`)과 따로 선언했다.

**What was tried**: 실제 동작에는 영향이 없어(세 값이 모두 3/3600으로 같음)
고치지 않고 그대로 두었다.

**Proposed next step**: `MIN_INTERVAL_SECONDS`·`MAX_INTERVAL_SECONDS`를
`lib/time.ts`에서 export해서 `interval-dial.tsx`와 `interval-settings.tsx`가
그 값을 가져다 쓰게 한다.
