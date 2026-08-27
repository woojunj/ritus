export interface RingGeometry {
  circumference: number;
  offset: number;
}

// fraction=1이면 링이 꽉 차고(offset 0), fraction=0이면 완전히 빈다(offset
// 둘레 전체). 원형 진행 표시(다이얼의 선택 구간, 진행 화면의 남은 시간)가
// 공유하는 순수 계산이다.
export function ringGeometry(radius: number, fraction: number): RingGeometry {
  const clamped = Math.min(1, Math.max(0, fraction));
  const circumference = 2 * Math.PI * radius;
  return { circumference, offset: circumference * (1 - clamped) };
}
