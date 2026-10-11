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

// iOS는 사용자가 누른 순간에 연 오디오 컨텍스트만 소리를 낸다. 시작 버튼을
// 누를 때 연 것을 닫지 않고 두었다가, 타이머가 울리는 구간 전환음과 종료음도
// 그 컨텍스트로 낸다.
let shared: { ctor: typeof AudioContext; ctx: AudioContext } | null = null;

function sharedContext(Ctor: typeof AudioContext): AudioContext {
  if (!shared || shared.ctor !== Ctor || shared.ctx.state === "closed") {
    shared = { ctor: Ctor, ctx: new Ctor() };
    watchForWake();
  }
  return shared.ctx;
}

function wake(): void {
  const ctx = shared?.ctx;
  if (ctx && ctx.state !== "running" && ctx.state !== "closed") void ctx.resume?.();
}

let watching = false;

// 다른 앱이나 탭에 다녀오면 iOS가 컨텍스트를 멈춰 둔다. 화면이 다시 보일 때
// 깨워 보고, 그래도 안 깨면 사용자가 화면을 누르는 순간에 다시 깨운다.
function watchForWake(): void {
  if (watching || typeof document === "undefined") return;
  watching = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") wake();
  });
  document.addEventListener("pointerdown", wake);
  document.addEventListener("keydown", wake);
}

export function playChime(kind: ChimeKind, options: ChimeOptions = {}): void {
  const { muted = false } = options;
  if (muted) return;

  const Ctor = resolveAudioContextCtor(options.audioContextCtor);
  if (!Ctor) return;

  const ctx = sharedContext(Ctor);
  // 화면이 가려졌다 돌아오면 멈춰 있을 수 있다.
  if (ctx.state !== "running") void ctx.resume?.();

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
}
