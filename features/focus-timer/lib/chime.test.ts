import { describe, expect, test, vi } from "vitest";

import { playChime } from "./chime";

function createFakeAudioContext() {
  const oscillator = {
    connect: vi.fn(),
    frequency: { value: 0 },
    start: vi.fn(),
    stop: vi.fn(),
    onended: null as (() => void) | null,
  };
  const gain = {
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
  };
  const ctx = {
    currentTime: 0,
    destination: {},
    createOscillator: vi.fn(() => oscillator),
    createGain: vi.fn(() => gain),
    close: vi.fn(),
  };
  const Ctor = vi.fn(function FakeAudioContext() {
    return ctx;
  });
  return { Ctor, ctx, oscillator, gain };
}

describe("playChime", () => {
  test("음소거가 아니면 오실레이터를 만들어 재생한다", () => {
    const { Ctor, oscillator } = createFakeAudioContext();

    playChime("start", { muted: false, audioContextCtor: Ctor as never });

    expect(Ctor).toHaveBeenCalledTimes(1);
    expect(oscillator.start).toHaveBeenCalledTimes(1);
  });

  test("음소거이면 오디오 컨텍스트를 만들지 않는다", () => {
    const { Ctor } = createFakeAudioContext();

    playChime("end", { muted: true, audioContextCtor: Ctor as never });

    expect(Ctor).not.toHaveBeenCalled();
  });

  test("AudioContext를 쓸 수 없으면 조용히 아무 일도 하지 않는다", () => {
    expect(() =>
      playChime("start", { muted: false, audioContextCtor: undefined })
    ).not.toThrow();
  });
});
