// 홍익학당 양심노트 양식(A4, 20191010)의 문구. 원문 그대로 둔다.

export const LEVELS = ["찜찜", "찜자", "자찜", "자명"] as const;

export type VirtueKey =
  | "immersion"
  | "love"
  | "justice"
  | "propriety"
  | "sincerity"
  | "wisdom";

export type Virtue = {
  key: VirtueKey;
  name: string;
  questions: string[];
  /** 도표에서 축이 놓이는 각도(도). 오른쪽이 0이고 시계 방향으로 커진다. */
  angle: number;
};

// 양식에 적힌 순서.
export const VIRTUES: Virtue[] = [
  {
    key: "immersion",
    name: "몰입",
    questions: ["지금 이 순간 깨어있는가?", "당시에는 깨어있었는가?"],
    angle: 120,
  },
  {
    key: "love",
    name: "사랑",
    questions: ["상대방의 입장을 내 입장처럼 진심으로 이해하고 배려했는가?"],
    angle: 180,
  },
  {
    key: "justice",
    name: "정의",
    questions: ["내가 당하기 싫은 일을 상대방에게 가하지는 않았는가?"],
    angle: 0,
  },
  {
    key: "propriety",
    name: "예절",
    questions: [
      "처한 상황을 있는 그대로 진심으로 수용했는가?",
      "생각과 언행이 겸손하며 상황과 조화를 이루었는가?",
    ],
    angle: 240,
  },
  {
    key: "sincerity",
    name: "성실",
    questions: ["양심의 인도를 따르는 데 최선의 노력을 기울였는가?"],
    angle: 300,
  },
  {
    key: "wisdom",
    name: "지혜",
    questions: ["나의 선택과 판단은 찜찜함 없이 자명한가?"],
    angle: 60,
  },
];

export const COPYRIGHT_NOTICE =
  "© 이 양심노트의 내용과 형식은 저작권자(윤홍식) 또는 홍익학당의 허가 없이 상업적 용도로 활용하실 수 없습니다.";
