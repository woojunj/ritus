export type ChimeKind = "start" | "end";

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

// 소리는 음원 파일 없이 오실레이터로 짧게 두 음(시작/종료)만 낸다.
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

  oscillator.frequency.value = kind === "start" ? 880 : 660;
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.45);
  oscillator.onended = () => ctx.close();
}
