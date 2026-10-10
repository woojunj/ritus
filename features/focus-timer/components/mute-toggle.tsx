"use client";

import { Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";

import { setMuted, useMuted } from "../lib/muted";

export function MuteToggle() {
  const muted = useMuted();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-pressed={muted}
      onClick={() => setMuted(!muted)}
    >
      {muted ? (
        <VolumeX aria-hidden="true" />
      ) : (
        <Volume2 aria-hidden="true" />
      )}
      <span className="sr-only">{muted ? "소리 켜기" : "소리 끄기"}</span>
    </Button>
  );
}
