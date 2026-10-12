import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

// 서버와 hydration 첫 렌더에서는 false, 그 뒤로는 true. 브라우저에서만 알 수 있는
// 값(테마, 저장된 글)이 들어왔는지 가릴 때 쓴다. 이펙트에서 setState로 그 간극을
// 메우면 리렌더가 한 번 더 생기고 최근 lint 규칙에도 걸리므로, 마운트 여부 자체를
// useSyncExternalStore로 구독한다(구독 대상은 바뀌지 않으니 subscribe는 아무 일도
// 하지 않는다).
export function useMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}
