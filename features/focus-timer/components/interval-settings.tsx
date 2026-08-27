"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { formatCycleSummary, type IntervalPlan } from "../lib/cycle";
import {
  MAX_INTERVAL_SECONDS,
  MIN_INTERVAL_SECONDS,
  clampIntervalSeconds,
} from "../lib/time";
import { IntervalDial } from "./interval-dial";

interface IntervalSettingsProps {
  enabled: boolean;
  onToggleEnabled: () => void;
  plan: IntervalPlan;
  onPlanChange: (plan: IntervalPlan) => void;
  totalSeconds: number;
}

export function IntervalSettings({
  enabled,
  onToggleEnabled,
  plan,
  onPlanChange,
  totalSeconds,
}: IntervalSettingsProps) {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-pressed={enabled}
        onClick={onToggleEnabled}
      >
        구간 반복
      </Button>

      {enabled && (
        <IntervalFields
          plan={plan}
          onPlanChange={onPlanChange}
          totalSeconds={totalSeconds}
        />
      )}
    </div>
  );
}

// 스위치를 켤 때마다 새로 마운트되므로, 두 번째 구간이 첫 구간을 따라가는
// linked 상태도 그때마다 초기값(따라감)으로 되돌아온다.
function IntervalFields({
  plan,
  onPlanChange,
  totalSeconds,
}: {
  plan: IntervalPlan;
  onPlanChange: (plan: IntervalPlan) => void;
  totalSeconds: number;
}) {
  const [linked, setLinked] = useState(true);

  const handleFirstChange = (seconds: number) => {
    onPlanChange(linked ? { first: seconds, second: seconds } : { ...plan, first: seconds });
  };

  const handleSecondChange = (seconds: number) => {
    setLinked(false);
    onPlanChange({ ...plan, second: seconds });
  };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-6">
        <SecondsField
          label="첫 구간"
          ariaLabel="첫 구간(초)"
          value={plan.first}
          onChange={handleFirstChange}
        />
        <SecondsField
          label="두 번째 구간"
          ariaLabel="두 번째 구간(초)"
          value={plan.second}
          onChange={handleSecondChange}
        />
      </div>
      <p data-testid="interval-summary" className="text-xs text-muted-foreground">
        {formatCycleSummary(totalSeconds, plan)}
      </p>
    </div>
  );
}

function SecondsField({
  label,
  ariaLabel,
  value,
  onChange,
}: {
  label: string;
  ariaLabel: string;
  value: number;
  onChange: (seconds: number) => void;
}) {
  // 로컬 텍스트로 들고 있다가 유효한 값일 때만 커밋한다. 큰 다이얼의 분
  // 입력과 같은 이유다: 값을 지우는 동안 즉시 스냅되지 않게 한다.
  const [text, setText] = useState(() => String(value));
  const [synced, setSynced] = useState(value);
  if (value !== synced) {
    setSynced(value);
    setText(String(value));
  }

  const commit = (next: number) => {
    const clamped = clampIntervalSeconds(next);
    onChange(clamped);
    setText(String(clamped));
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <IntervalDial seconds={value} onChange={onChange} ariaLabel={`${label} 다이얼`} />
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          aria-label={ariaLabel}
          min={MIN_INTERVAL_SECONDS}
          max={MAX_INTERVAL_SECONDS}
          value={text}
          onChange={(event) => {
            const raw = event.target.value;
            setText(raw);
            if (raw.trim() === "") return;
            const parsed = Number(raw);
            if (!Number.isNaN(parsed)) {
              onChange(clampIntervalSeconds(parsed));
            }
          }}
          onBlur={() => {
            const parsed = Number(text);
            commit(Number.isNaN(parsed) ? value : parsed);
          }}
          className="w-16 text-center"
        />
        <div className="flex flex-col">
          <button
            type="button"
            aria-label={`${label} 늘리기`}
            onClick={() => commit(value + 1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronUp aria-hidden="true" className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`${label} 줄이기`}
            onClick={() => commit(value - 1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronDown aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
