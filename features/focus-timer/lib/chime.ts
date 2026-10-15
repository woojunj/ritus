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
// 화면이 가려진 적이 있는 컨텍스트. iOS에서는 돌아온 뒤 상태가 running이어도
// 소리가 나지 않고 깨워도 살아나지 않는 일이 있어, 믿지 않고 새로 연다.
let stale = false;

function sharedContext(Ctor: typeof AudioContext): AudioContext {
  if (!shared || shared.ctor !== Ctor || shared.ctx.state === "closed") {
    shared = { ctor: Ctor, ctx: new Ctor() };
    stale = false;
    watchPage();
  }
  return shared.ctx;
}

// 사용자가 화면을 누르거나 키를 누른 순간에 부른다. 이때 연 컨텍스트만 iOS가 받아 준다.
function refreshOnGesture(): void {
  if (!shared) return;
  const { ctor, ctx } = shared;
  if (stale) {
    stale = false;
    void ctx.close?.();
    shared = { ctor, ctx: new ctor() };
  } else if (ctx.state !== "running" && ctx.state !== "closed") {
    void ctx.resume?.();
  }
}

let watching = false;

function watchPage(): void {
  if (watching || typeof document === "undefined") return;
  watching = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") stale = true;
    // 돌아왔을 때 누르지 않아도 살아나는 경우가 있어 먼저 깨워 본다.
    else void shared?.ctx.resume?.();
  });
  // iOS는 누르기 시작할 때가 아니라 손을 뗄 때를 사용자의 동작으로 친다. 버튼의
  // 동작보다 먼저 돌도록 캡처 단계에서 듣는다.
  for (const type of ["touchend", "click", "keydown"]) {
    document.addEventListener(type, refreshOnGesture, true);
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
