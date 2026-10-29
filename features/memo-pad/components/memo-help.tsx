"use client";

import { GuidedHelp, type HelpStep } from "@/components/guided-help";

const EDITOR: readonly HelpStep[] = [
  { target: "format", title: "글의 형식 고르기", text: "txt는 일반 글, md는 마크다운입니다. md를 고르면 넓은 화면에서는 편집 옆에 프리뷰가 나타나고, 좁은 화면에서는 눈 아이콘으로 편집과 프리뷰를 오갑니다. 형식을 바꿔도 쓴 글은 유지됩니다." },
  { target: "content", title: "메모 본문 쓰기", text: "이곳에 글을 적습니다. 타이머나 할 일과 연결되지 않는 독립 문서이며, 다른 화면으로 이동해도 쓰던 글이 남습니다. 아래 상태 표시줄에서는 커서 위치와 줄·글자 수를 확인할 수 있습니다." },
  { target: "autosave", title: "쓰는 동안 자동 저장", text: "쓰는 내용과 형식은 이 브라우저에 자동 저장됩니다. ‘자동 저장됨’ 표시를 확인하세요. ‘저장하지 못함’이 보이면 파일로 백업하세요. 자동 저장은 현재 쓰는 글을 유지하는 기능입니다." },
  { target: "save", title: "저장 목록에 한 장 남기기", text: "디스크 아이콘을 누르면 지금 글의 복사본을 저장 목록에 한 장 더 남깁니다. 쓰던 글은 비우지 않습니다. 빈 글은 저장하지 않으며, Ctrl+S 또는 Cmd+S로도 목록에 저장합니다." },
  { target: "library", title: "저장한 메모 찾아보기", text: "목록 아이콘을 누르면 저장한 메모와 임시 보관본을 봅니다. 메모를 저장하면 목록에서 돋보기로 본문을 검색할 수 있습니다. 같은 버튼으로 편집 화면에 돌아옵니다." },
  { target: "copy", title: "본문 전체 복사하기", text: "현재 편집 문서의 글 전체를 클립보드에 복사합니다. 복사한 글은 다른 곳에 직접 붙여넣어 사용할 수 있습니다." },
  { target: "download", title: "글을 파일로 내려받기", text: "현재 글을 선택한 형식의 txt 또는 md 파일로 내려받습니다. 이 기기 밖에 백업하거나 다른 기기로 옮길 때 씁니다. 목록에 한 장 남기는 디스크 저장과는 별도 기능입니다." },
  { target: "import", title: "파일을 메모장으로 불러오기", text: "txt나 md 파일을 골라 현재 편집 문서의 글과 형식을 바꿉니다. 뒤에 이어 붙이지 않습니다. 쓰던 글이 있으면 먼저 바꿀지 확인하므로, 필요한 글은 목록이나 파일에 저장해 두세요." },
];
const LIBRARY: readonly HelpStep[] = [
  { target: "saved", title: "저장한 메모와 임시 보관", text: "저장한 메모는 날짜·시각과 첫 줄로 구분합니다. 카드를 누르면 편집 자리에 불러옵니다. 쓰던 글이 있으면 확인을 받고 한 칸짜리 임시 보관에 넣습니다. 임시 보관본은 목록 맨 위에서 되돌릴 수 있습니다. 삭제는 각 카드의 휴지통을 누른 뒤 확인합니다." },
  { target: "search", title: "저장한 글 검색하기", text: "돋보기로 검색을 열고 저장한 메모 본문과 임시 보관본을 찾습니다. 여러 낱말을 입력하면 모두 포함한 글만 남습니다. 검색을 닫거나 편집 화면으로 돌아가면 검색어는 지워집니다. 편집 중인 문서 안에서 찾는 기능은 아닙니다." },
  { target: "library", title: "쓰던 글로 돌아가기", text: "연필 아이콘을 누르면 현재 편집 문서로 돌아갑니다. 목록에서 메모를 불러오지 않는 한 쓰던 글은 그대로 유지됩니다." },
];

export function MemoHelp({ listOpen, hasSaved }: { listOpen: boolean; hasSaved: boolean }) {
  const steps = listOpen ? LIBRARY.filter(step => hasSaved || step.target !== "search") : EDITOR;
  return <GuidedHelp name="메모장" steps={steps} targetAttribute="data-memo-help" />;
}
