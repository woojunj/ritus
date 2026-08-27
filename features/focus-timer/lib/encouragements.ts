export const ENCOURAGEMENTS = [
  "고생했다",
  "수고했다",
  "잘 했다",
  "오늘도 해냈다",
  "충분히 잘하고 있다",
] as const;

export function pickEncouragement(random: () => number = Math.random): string {
  const index = Math.floor(random() * ENCOURAGEMENTS.length);
  const clamped = Math.min(ENCOURAGEMENTS.length - 1, Math.max(0, index));
  return ENCOURAGEMENTS[clamped];
}
