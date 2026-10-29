"use client";

import { GuidedHelp, type HelpStep } from "@/components/guided-help";

const ADD: HelpStep = { target: "add", title: "할 일 추가하기", text: "할 일을 적고 + 버튼이나 Enter로 목록에 추가합니다. 새 할 일은 맨 위에 놓이고 이 브라우저에 자동 저장됩니다. 할 일을 추가하면 검색·복사·파일 저장·편집 버튼도 나타납니다." };
const CHECK: HelpStep = { target: "check", title: "끝낸 일 체크하고 다시 활성화하기", text: "왼쪽 체크박스를 누르면 완료로 표시하고 항목을 비활성화합니다. 삭제하지 않으며 원래 자리에 남습니다. 다시 체크를 해제하면 활성화되어 타이머에 가져갈 수 있습니다. 체크 상태는 저장·백업되며 타이머 완주 횟수와는 별개입니다. 진행 중인 세션은 체크해도 그대로 이어집니다." };
const CARD: HelpStep = { target: "card", title: "할 일을 타이머에 가져가기", text: "카드를 누르면 할 일 제목이 채워진 타이머 설정 화면으로 이동합니다. 시간을 정하고 재생 버튼으로 시작하세요. 진행 중인 다른 세션이 있으면 그만두고 바꿀지 먼저 확인합니다. 타이머를 끝까지 마치면 해당 할 일에 완주 횟수가 표시됩니다." };
const SEARCH: HelpStep = { target: "search", title: "할 일 제목 검색하기", text: "돋보기로 검색 칸을 열고 제목에 포함된 글로 찾습니다. 여러 낱말을 쓰면 모두 포함한 제목만 남습니다. 검색을 닫으면 전체 목록이 다시 보입니다. 입력 칸 밖에서 /를 눌러도 검색을 엽니다." };
const EDIT: HelpStep = { target: "edit", title: "필요 없는 할 일 삭제하기", text: "‘편집’을 누르면 각 카드에 휴지통이 나타납니다. 휴지통을 누르고 삭제를 확인하면 그 할 일이 지워집니다. 편집 상태의 ‘완료’는 삭제 편집을 끝내는 버튼이며, 할 일을 완주했다는 뜻은 아닙니다." };
const COPY: HelpStep = { target: "copy", title: "목록을 글로 복사하기", text: "전체 할 일 목록을 제목·완주 횟수·체크 상태가 담긴 CSV 글로 클립보드에 복사합니다. 검색 중이어도 전체 목록을 복사합니다. 필요한 곳에 직접 붙여넣어 사용할 수 있습니다." };
const DOWNLOAD: HelpStep = { target: "download", title: "목록을 파일로 보관하기", text: "제목·완주 횟수·체크 상태를 포함한 전체 목록을 CSV 파일로 내려받습니다. 검색 결과만 저장하는 것은 아닙니다. 다른 기기로 옮기거나 별도로 보관할 때 사용하세요. 이전 파일처럼 체크 정보가 없으면 미체크로 불러옵니다." };
const IMPORT: HelpStep = { target: "import", title: "할 일 파일 불러오기", text: "저장해 둔 CSV 파일의 할 일을 체크 상태와 함께 목록 뒤에 더합니다. 이전 파일에 체크 정보가 없으면 미체크로 불러옵니다. 기존 할 일을 덮어쓰지 않으며, 같은 제목이 이미 있으면 체크 상태도 그대로 두고 건너뜁니다. 목록이 비어 있어도 파일로 시작할 수 있습니다." };

export function TodoHelp({ hasItems, hasVisibleItems }: { hasItems: boolean; hasVisibleItems: boolean }) {
  const steps = hasItems ? [ADD, ...(hasVisibleItems ? [CHECK, CARD] : []), SEARCH, EDIT, COPY, DOWNLOAD, IMPORT] : [ADD, IMPORT];
  return <GuidedHelp name="할 일 목록" steps={steps} targetAttribute="data-todo-help" />;
}
