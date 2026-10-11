// 세션이 끝났을 때 하나를 골라 보여 주는 말. 누구에게나 편하도록 반말을 쓰지
// 않고, 잘했는지를 매기지 않는다. 마친 것을 알아주는 말과 쉬어 가라는 말을 섞는다.
export const ENCOURAGEMENTS = [
  "잘 마치셨습니다",
  "애쓰셨습니다",
  "오늘도 한 걸음",
  "충분합니다",
  "깊이 머문 시간",
  "고요",
  "잠시 쉬어 가세요",
  "이제 쉬셔도 좋습니다",
] as const;

export function pickEncouragement(random: () => number = Math.random): string {
  const index = Math.floor(random() * ENCOURAGEMENTS.length);
  const clamped = Math.min(ENCOURAGEMENTS.length - 1, Math.max(0, index));
  return ENCOURAGEMENTS[clamped];
}
