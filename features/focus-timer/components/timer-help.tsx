"use client";

import { GuidedHelp, type HelpStep } from "@/components/guided-help";

const TITLE: HelpStep = { target: "title", title: "지금 할 일 정하기", text: "지금 무엇을 할지 제목으로 적습니다. 세션 중에도 제목이 남아 돌아올 곳을 알려줍니다. 비워 두고 바로 시작해도 됩니다." };
const TIME: HelpStep = { target: "time", title: "원 위에서 시간 정하기", text: "원 위를 끌어 총 시간을 1~60분으로 정합니다. 처음에는 25분입니다. 원 아래 숫자 칸에 직접 입력해도 같은 시간이 반영됩니다." };
const MINUTES: HelpStep = { target: "minutes", title: "숫자로 직접 입력하기", text: "원 대신 이 칸에 원하는 분을 입력할 수 있습니다. 설정한 시간은 원 가운데에도 똑같이 표시됩니다." };
const REPEAT: HelpStep = { target: "repeat", title: "두 구간을 번갈아 반복하기", text: "운동과 휴식, 들숨과 날숨처럼 두 구간을 번갈아 반복할 때 켭니다. 두 구간의 길이는 같아도 됩니다.\n20초 운동과 10초 휴식을 번갈아 하는 타바타 운동에 쓰거나, 정신을 깨우고 싶을 때 두 구간을 각각 1초로 설정해 짧은 알림 소리를 번갈아 들을 수 있습니다.\n\n켜면 아래 또는 오른쪽에 구간 설정이 나타납니다. 한 구간만 쓰려면 꺼 둡니다. 안내는 이 설정을 바꾸지 않습니다." };
const INTERVALS: readonly HelpStep[] = [
  { target: "first", title: "첫 구간의 길이", text: "작은 원을 끌거나 숫자로 첫 구간을 정합니다. 단위는 초이며 1초부터 1시간까지 설정합니다. 한 바퀴는 60초이고, 더 긴 시간은 숫자로 입력합니다. 두 번째 구간을 직접 조정하기 전에는 첫 구간을 바꾸면 두 번째도 함께 바뀝니다." },
  { target: "second", title: "두 번째 구간의 길이", text: "두 번째 구간을 같은 방법으로 정합니다. 한 번 직접 조정하면 첫 구간과 따로 바뀝니다. 예를 들어 운동 20초와 휴식 10초처럼 사용할 수 있습니다." },
  { target: "summary", title: "실제로 끝나는 시간 확인하기", text: "몇 번 반복하고 총 얼마 동안 진행되는지 미리 보여 줍니다. 마지막 반복은 두 구간을 모두 채우고 끝나므로, 처음 정한 총 시간보다 조금 길어질 수 있습니다." },
];
const SOUND: HelpStep = { target: "sound", title: "세션 알림 소리", text: "위쪽 소리 아이콘으로 시작·구간 전환·종료 효과음을 켜거나 끕니다. 아이폰·아이패드에서는 다른 앱이나 홈 화면으로 가면 소리가 멈출 수 있습니다. 화면으로 돌아오면 한 번 눌러 주세요." };
const START: HelpStep = { target: "start", title: "준비되면 시작하기", text: "재생 버튼을 누르면 정한 시간으로 시작합니다. 아무 곳에도 포커스가 없을 때 Space로도 시작할 수 있습니다. 이 안내를 마치는 것만으로 세션이 시작되지는 않습니다." };
const RUNNING: readonly HelpStep[] = [
  { target: "progress", title: "남은 시간을 원으로 보기", text: "남은 시간이 줄어들면 원도 함께 줄어듭니다. 안내를 보고 있어도 세션은 계속 흐릅니다. 멈춰서 살펴보고 싶으면 안내를 닫고 먼저 일시정지하세요." },
  { target: "clock", title: "숫자를 가리거나 다시 보기", text: "남은 시간 옆의 눈 아이콘으로 숫자를 가리거나 다시 표시할 수 있습니다. 숫자를 가려도 원과 타이머는 계속 움직입니다." },
  { target: "pause", title: "일시정지와 이어서", text: "일시정지는 지금 구간과 전체 남은 시간을 함께 멈춥니다. ‘이어서’를 누르면 멈춘 자리부터 이어집니다. 아무 곳에도 포커스가 없을 때 Space로도 조작할 수 있습니다. 도움말을 여는 것만으로 멈추거나 재개하지는 않습니다." },
  { target: "quit", title: "그만두고 설정으로 돌아가기", text: "정지 아이콘을 누르면 현재 세션을 그만두고 설정 화면으로 돌아갑니다. 중도 종료를 실패로 표시하거나 기록하지 않습니다. 다른 화면으로 이동하는 것만으로는 세션이 끝나지 않습니다." },
  SOUND,
];
const ENDED: readonly HelpStep[] = [
  { target: "ending", title: "세션을 마쳤습니다", text: "시간이 다 되면 효과음과 격려 문구로 알려 줍니다. 화면을 누르면 깜빡임이 멈춥니다." },
  { target: "restart", title: "같은 설정으로 한 번 더", text: "되돌리기 아이콘을 누르면 같은 제목과 시간, 반복 설정으로 다시 시작합니다. 아무 곳에도 포커스가 없을 때 Space로도 다시 시작합니다." },
  { target: "new-setup", title: "제목과 시간을 새로 정하기", text: "설정 아이콘을 누르면 설정 화면으로 돌아갑니다. 기존 값을 보면서 다음에 할 일과 시간을 바꿀 수 있습니다. 도움말을 마치는 것만으로 재시작하지는 않습니다." },
];

const SETUP = [TITLE, TIME, MINUTES, REPEAT, SOUND, START];
const REPEATING_SETUP = [TITLE, TIME, MINUTES, REPEAT, ...INTERVALS, SOUND, START];

export function TimerHelp({ phase, intervalEnabled }: { phase: "setup" | "running" | "paused" | "ended"; intervalEnabled: boolean }) {
  const steps = phase === "setup" ? intervalEnabled ? REPEATING_SETUP : SETUP : phase === "ended" ? ENDED : RUNNING;
  return <GuidedHelp name="타이머" steps={steps} targetAttribute="data-timer-help" />;
}
