import { SessionBar } from "@/features/focus-timer";
import { MemoPad } from "@/features/memo-pad";

export default function MemoPage() {
  return (
    <>
      <SessionBar showWhenIdle />
      <MemoPad />
    </>
  );
}
