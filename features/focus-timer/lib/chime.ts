export type ChimeKind = "start" | "end" | "interval-first" | "interval-second";

interface ChimeOptions {
  muted?: boolean;
  audioContextCtor?: typeof AudioContext;
}

function resolveAudioContextCtor(
  provided: typeof AudioContext | undefined
): typeof AudioContext | undefined {
  if (provided) return provided;
  if (typeof window === "undefined") return undefined;
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  );
}

// 소리는 음원 파일 없이 오실레이터로 짧게 낸다. 시작·종료 두 음과, 두 구간
// 반복에서 구간이 바뀔 때마다 울리는 전환음 두 개(첫 구간이 더 높다)다.
const FREQUENCIES: Record<ChimeKind, number> = {
  start: 880,
  end: 660,
  "interval-first": 740,
  "interval-second": 520,
};

export function playChime(kind: ChimeKind, options: ChimeOptions = {}): void {
  const { muted = false } = options;
  if (muted) return;

  const Ctor = resolveAudioContextCtor(options.audioContextCtor);
  if (!Ctor) return;

  const ctx = new Ctor();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.frequency.value = FREQUENCIES[kind];
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.45);
  oscillator.onended = () => ctx.close();
}
