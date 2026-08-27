import type { SliceKind } from "./cycle";

// 실행 화면의 구간 표시와 설정 화면의 구간 다이얼이 공유하는 숫자·색 매핑.
export const SLICE_NUMBER: Record<SliceKind, number> = {
  first: 1,
  second: 2,
};

export const SLICE_BADGE_CLASS: Record<SliceKind, string> = {
  first: "bg-primary text-primary-foreground",
  second: "bg-secondary text-secondary-foreground",
};
