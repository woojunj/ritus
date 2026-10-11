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

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
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

  test("시작할 때 연 오디오 컨텍스트를 닫지 않고 이후 소리에도 다시 쓴다", () => {
    const { Ctor, ctx, oscillator } = createFakeAudioContext();

    playChime("start", { muted: false, audioContextCtor: Ctor as never });
    oscillator.onended?.();
    playChime("interval-second", { muted: false, audioContextCtor: Ctor as never });
    playChime("end", { muted: false, audioContextCtor: Ctor as never });

    expect(Ctor).toHaveBeenCalledTimes(1);
    expect(ctx.close).not.toHaveBeenCalled();
    expect(oscillator.start).toHaveBeenCalledTimes(3);
  });

  test("컨텍스트가 멈춰 있으면 다시 깨워서 소리를 낸다", () => {
    const { Ctor, ctx } = createFakeAudioContext();
    const resume = vi.fn();
    Object.assign(ctx, { state: "suspended", resume });

    playChime("end", { muted: false, audioContextCtor: Ctor as never });

    expect(resume).toHaveBeenCalledTimes(1);
  });

  test("화면이 다시 보이면 멈춰 있는 컨텍스트를 깨워 본다", () => {
    const { Ctor, ctx } = createFakeAudioContext();
    const resume = vi.fn();
    Object.assign(ctx, { state: "running", resume });
    playChime("start", { muted: false, audioContextCtor: Ctor as never });

    Object.assign(ctx, { state: "interrupted" });
    setVisibility("visible");
    expect(resume).toHaveBeenCalledTimes(1);
  });

  test("다른 곳에 다녀온 뒤 처음 누를 때 컨텍스트를 새로 열고, 이후 소리는 새 컨텍스트로 낸다", () => {
    const { Ctor, ctx } = createFakeAudioContext();
    Object.assign(ctx, { state: "running", resume: vi.fn() });
    playChime("start", { muted: false, audioContextCtor: Ctor as never });

    setVisibility("hidden");
    setVisibility("visible");
    document.dispatchEvent(new Event("pointerup"));
    expect(ctx.close).toHaveBeenCalledTimes(1);
    expect(Ctor).toHaveBeenCalledTimes(2);

    document.dispatchEvent(new Event("click"));
    playChime("end", { muted: false, audioContextCtor: Ctor as never });
    expect(Ctor).toHaveBeenCalledTimes(2);
  });

  test("다녀온 적 없이 잘 돌고 있으면 눌러도 컨텍스트를 새로 열지 않는다", () => {
    const { Ctor, ctx } = createFakeAudioContext();
    Object.assign(ctx, { state: "running", resume: vi.fn() });
    playChime("start", { muted: false, audioContextCtor: Ctor as never });

    document.dispatchEvent(new Event("touchend"));
    expect(ctx.close).not.toHaveBeenCalled();
    expect(Ctor).toHaveBeenCalledTimes(1);
  });

  test("AudioContext를 쓸 수 없으면 조용히 아무 일도 하지 않는다", () => {
    expect(() =>
      playChime("start", { muted: false, audioContextCtor: undefined })
    ).not.toThrow();
  });
});

describe("구간 전환음", () => {
  test("첫 구간 전환음이 두 번째 구간 전환음보다 높다", () => {
    const first = createFakeAudioContext();
    playChime("interval-first", {
      muted: false,
      audioContextCtor: first.Ctor as never,
    });

    const second = createFakeAudioContext();
    playChime("interval-second", {
      muted: false,
      audioContextCtor: second.Ctor as never,
    });

    expect(first.oscillator.frequency.value).toBeGreaterThan(
      second.oscillator.frequency.value
    );
  });

  test("두 전환음은 시작·종료음과도 서로 다르다", () => {
    const values: number[] = [];
    for (const kind of ["start", "end", "interval-first", "interval-second"] as const) {
      const { Ctor, oscillator } = createFakeAudioContext();
      playChime(kind, { muted: false, audioContextCtor: Ctor as never });
      values.push(oscillator.frequency.value);
    }
    expect(new Set(values).size).toBe(values.length);
  });
});
