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

// 다른 앱이나 탭에 다녀오면 iOS는 컨텍스트를 멈춘 채 resume()을 받아 주지
// 않거나, running이라면서 소리를 내지 않는다. 그런 컨텍스트는 버리고 다시 연다.
let stale = false;

function openContext(Ctor: typeof AudioContext): AudioContext {
  const ctx = new Ctor();
  shared = { ctor: Ctor, ctx };
  stale = false;
  watchForReturn();
  return ctx;
}

function sharedContext(Ctor: typeof AudioContext): AudioContext {
  if (!shared || shared.ctor !== Ctor || shared.ctx.state === "closed") {
    return openContext(Ctor);
  }
  return shared.ctx;
}

function wake(): void {
  const ctx = shared?.ctx;
  if (ctx && ctx.state !== "running" && ctx.state !== "closed") void ctx.resume?.();
}

// 사용자가 누른 순간이라 iOS가 새 컨텍스트에 소리를 허락한다.
function renewOnGesture(): void {
  if (!shared) return;
  if (!stale && (shared.ctx.state as string) !== "interrupted") return;
  void shared.ctx.close?.();
  void openContext(shared.ctor).resume?.();
}

let watching = false;

// 화면이 다시 보일 때는 기존 컨텍스트를 깨워 보고, 다녀온 뒤 처음 누르는
// 순간에는 컨텍스트를 새로 연다. 시작 버튼보다 먼저 받도록 capture로 듣는다.
function watchForReturn(): void {
  if (watching || typeof document === "undefined") return;
  watching = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") stale = true;
    else wake();
  });
  for (const type of ["touchend", "pointerup", "click", "keydown"]) {
    document.addEventListener(type, renewOnGesture, { capture: true });
  }
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
