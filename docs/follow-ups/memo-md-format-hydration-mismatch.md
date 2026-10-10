# 메모장을 md 형식으로 저장해 둔 채 `/memo`를 새로 열면 hydration 불일치가 난다

**Symptom**: 형식을 md로 골라 둔 브라우저에서 `/memo`를 직접 열거나 새로고침하면 Next 개발 오버레이에 "1 Issue"가 뜨고, 서버 로그에 hydration mismatch가 찍힌다. 화면은 클라이언트에서 다시 그려져 정상으로 보인다.

**Observed evidence**: `next dev`에서 `/memo`를 열었을 때 서버 로그에 `https://react.dev/link/hydration-mismatch`와 함께 [features/memo-pad/memo-pad.tsx](../../features/memo-pad/memo-pad.tsx)의 프리뷰 전환 버튼(`<Eye />`) 자리가 서버 출력과 다르다고 나왔다. 서버 출력에는 내려받기 아이콘이, 클라이언트 출력에는 프리뷰 전환 아이콘이 있었다.

**Suspected cause**: `useState<MemoDoc>(loadMemo)`가 서버에서는 빈 txt 문서를, 브라우저에서는 `localStorage`의 md 문서를 초기값으로 써서 첫 렌더가 서로 다르다. 자동 저장 표시를 넣기 전부터 있던 구조다.

**What was tried**: 없음. 자동 저장 표시 작업의 범위 밖이라 원인만 확인했다.

**Proposed next step**: 할 일 목록처럼 `useSyncExternalStore`로 저장된 문서를 읽거나, 마운트 뒤에 저장된 문서를 불러오게 바꾼다.
