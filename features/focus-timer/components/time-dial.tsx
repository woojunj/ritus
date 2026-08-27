"use client";

import { angleToMinutes, minutesToAngle } from "../lib/time";
import { Dial } from "./dial";

interface TimeDialProps {
  minutes: number;
  onChange: (minutes: number) => void;
  disabled?: boolean;
}

export function TimeDial({ minutes, onChange, disabled }: TimeDialProps) {
  return (
    <Dial
      value={minutes}
      min={1}
      max={60}
      valueToAngle={minutesToAngle}
      angleToValue={angleToMinutes}
      onChange={onChange}
      ariaLabel="시간 다이얼"
      ariaValueText={(value) => `${value}분`}
      disabled={disabled}
    />
  );
}
