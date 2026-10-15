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

  test("다른 곳에 다녀온 뒤 화면을 누르면 컨텍스트를 새로 열어 그것으로 소리를 낸다", () => {
    const first = createFakeAudioContext();
    const second = createFakeAudioContext();
    Object.assign(first.ctx, { state: "running" });
    Object.assign(second.ctx, { state: "running" });
    const Ctor = vi
      .fn()
      .mockImplementationOnce(function () {
        return first.ctx;
      })
      .mockImplementationOnce(function () {
        return second.ctx;
      });
    const setVisibility = (state: string) => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: state,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    };

    playChime("start", { muted: false, audioContextCtor: Ctor as never });
    document.dispatchEvent(new Event("click"));
    expect(Ctor).toHaveBeenCalledTimes(1);

    setVisibility("hidden");
    setVisibility("visible");
    document.dispatchEvent(new Event("click"));
    expect(first.ctx.close).toHaveBeenCalledTimes(1);
    expect(Ctor).toHaveBeenCalledTimes(2);

    playChime("end", { muted: false, audioContextCtor: Ctor as never });
    expect(second.oscillator.start).toHaveBeenCalledTimes(1);
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
