import { useSyncExternalStore } from "react";

import { GuidedHelp, type HelpStep } from "@/components/guided-help";

const SOURCE: HelpStep = { target: "source", title: "원문을 보며 필사하기", text: "기본 원문은 윤홍식의 「깨어있는 마음을 챙기는 요결」 전문입니다. 원문은 별도로 스크롤할 수 있습니다. PC에서는 왼쪽, 모바일에서는 위쪽에 보입니다." };
const CONTENT: HelpStep = { target: "content", title: "줄 있는 입력란에 쓰기", text: "원문을 보며 이곳에 글을 적습니다. 일반 메모와 필사한 글은 따로 보관됩니다. 모드를 바꾸거나 원문을 편집해도 필사한 글은 유지됩니다." };
const AUTOSAVE: HelpStep = { target: "autosave", title: "필사와 원문 자동 저장", text: "필사한 글과 편집한 원문은 각각 이 브라우저에 자동 저장됩니다. ‘저장하지 못함’이 보이면 전체 백업을 이용하세요. 헤더의 전체 백업에는 일반 메모와 필사한 글, 원문이 함께 포함됩니다." };
const EDIT: HelpStep = { target: "edit", title: "필사할 원문 편집하기", text: "연필 아이콘을 눌러 원문을 직접 바꿀 수 있습니다. 수정은 자동 저장됩니다. ‘편집 마치기’를 누르면 읽는 화면으로 돌아오며 필사한 글은 그대로 남습니다." };
const RESTORE: HelpStep = { target: "restore", title: "기본 원문으로 돌아가기", text: "되돌리기 아이콘을 누르고 확인하면 원문만 기본 전문으로 돌아갑니다. 필사한 글은 지워지지 않습니다. 확인창에서 취소하면 원문도 바뀌지 않습니다." };
const EXPAND: HelpStep = { target: "expand", title: "모바일에서 넓게 보기", text: "‘화면 넓게’를 누르거나 필사 입력란에 커서를 두면 원문과 입력란만 넓게 보입니다. 키보드 위 공간은 원문에 60%, 입력란에 40%를 배정합니다. 원문을 스크롤하면서 참고할 수 있습니다." };
const SHRINK: HelpStep = { target: "shrink", title: "원래 화면으로 돌아가기", text: "‘화면 줄이기’를 누르면 상단 메뉴와 원문 편집 도구가 다시 보입니다. 글과 원문 스크롤 위치는 유지됩니다. 외장 키보드의 Escape로도 돌아갑니다." };

function subscribeNarrow(callback: () => void) {
  const query = window.matchMedia("(width < 48rem)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const getNarrow = () => window.matchMedia("(width < 48rem)").matches;
const getServerNarrow = () => false;

export function TranscriptionHelp({ expanded }: { expanded: boolean }) {
  const narrow = useSyncExternalStore(subscribeNarrow, getNarrow, getServerNarrow);
  const steps = expanded && narrow
    ? [SOURCE, CONTENT, AUTOSAVE, SHRINK]
    : [SOURCE, CONTENT, AUTOSAVE, EDIT, RESTORE, ...(narrow ? [EXPAND] : [])];
  return <GuidedHelp name="필사" steps={steps} targetAttribute="data-transcription-help" rootAttribute="data-transcription-help-root" />;
}
