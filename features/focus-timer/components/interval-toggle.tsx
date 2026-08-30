"use client";

import { ArrowLeftRight } from "lucide-react";

import { Button } from "@/components/ui/button";

import { SLICE_BADGE_CLASS, SLICE_NUMBER } from "../lib/slice-display";

interface IntervalToggleProps {
  enabled: boolean;
  onToggleEnabled: () => void;
}

export function IntervalToggle({ enabled, onToggleEnabled }: IntervalToggleProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-pressed={enabled}
      onClick={onToggleEnabled}
    >
      <span aria-hidden="true" className="flex items-center gap-1">
        <span
          className={`flex size-4 items-center justify-center rounded-full text-[10px] font-semibold ${SLICE_BADGE_CLASS.first}`}
        >
          {SLICE_NUMBER.first}
        </span>
        <ArrowLeftRight className="size-3" />
        <span
          className={`flex size-4 items-center justify-center rounded-full text-[10px] font-semibold ${SLICE_BADGE_CLASS.second}`}
        >
          {SLICE_NUMBER.second}
        </span>
      </span>
      <span className="sr-only">번갈아 반복</span>
    </Button>
  );
}
