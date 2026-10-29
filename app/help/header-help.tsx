"use client";

import { GuidedHelp, type HelpStep } from "@/components/guided-help";

const STEPS: HelpStep[] = [
  { target: "navigation", title: "화면 이동하기", text: "왼쪽부터 타이머, 메모장, 할 일 목록, 양심노트입니다. 지금 화면의 아이콘은 강조됩니다. 다른 화면으로 옮겨도 진행 중인 타이머는 이어집니다." },
  { target: "manual", title: "전체 사용법 다시 보기", text: "이 물음표는 전체 사용법을 엽니다. 각 화면 안의 물음표는 해당 화면의 기능을 직접 비추며 설명합니다. 상단 버튼 안내도 이 사용법 화면에서 다시 시작할 수 있습니다." },
  { target: "backup", title: "쓴 내용을 한 번에 백업하기", text: "전체 백업에서 ‘전체 저장’을 누르면 메모, 저장한 메모 목록, 할 일과 체크 상태, 양심노트를 JSON 파일 하나로 받습니다. ‘불러오기’는 내용을 미리 확인한 뒤 현재 자료 전체를 백업 내용으로 바꿉니다. 합치는 기능은 아니므로, 남길 내용은 먼저 전체 저장하세요. 소리·테마 설정은 포함하지 않습니다." },
  { target: "theme", title: "화면 밝기 고르기", text: "누를 때마다 라이트, 다크, 시스템 설정 순서로 바뀝니다. 시스템 설정은 기기의 밝은 화면·어두운 화면 설정을 따릅니다." },
  { target: "size", title: "글자와 버튼 크게 보기", text: "누를 때마다 보통, 크게, 아주 크게 순서로 글자와 아이콘이 커집니다. 고른 크기는 이 기기에 남습니다. 화면이 좁아지면 상단 버튼은 다음 줄로 배치될 수 있습니다." },
  { target: "sound", title: "타이머 소리 켜고 끄기", text: "타이머의 시작·구간 전환·종료 소리를 켜거나 끕니다. 소리만 바뀌며 타이머는 계속 진행됩니다. 켰는데도 소리가 없으면 기기의 음량과 무음 설정도 확인하세요." },
];

export function HeaderHelp() {
  return <GuidedHelp name="상단 버튼" steps={STEPS} targetAttribute="data-header-help" rootAttribute="data-header-help-root" triggerLabel="상단 버튼 안내 시작" />;
}
