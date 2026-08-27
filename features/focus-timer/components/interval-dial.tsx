"use client";

import { angleToSeconds, secondsToAngle } from "../lib/time";
import { Dial } from "./dial";

interface IntervalDialProps {
  seconds: number;
  onChange: (seconds: number) => void;
  ariaLabel: string;
  disabled?: boolean;
}

const SIZE = 120;
const MIN_SECONDS = 3;
const MAX_SECONDS = 3600;

// 두 구간 반복의 구간 하나를 정하는 작은 다이얼. 한 바퀴가 60초이고, 60초를
// 넘는 값은 숫자 칸으로만 정한다(다이얼은 한 바퀴를 다 채운 채로 남는다).
export function IntervalDial({
  seconds,
  onChange,
  ariaLabel,
  disabled,
}: IntervalDialProps) {
  return (
    <Dial
      value={seconds}
      min={MIN_SECONDS}
      max={MAX_SECONDS}
      valueToAngle={secondsToAngle}
      angleToValue={angleToSeconds}
      onChange={onChange}
      ariaLabel={ariaLabel}
      ariaValueText={(value) => `${value}초`}
      disabled={disabled}
      size={SIZE}
    />
  );
}
