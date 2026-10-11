import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { useScreenWakeLock } from "./wake-lock";

function Probe({ active }: { active: boolean }) {
  useScreenWakeLock(active);
  return null;
}

function stubWakeLock() {
  const release = vi.fn().mockResolvedValue(undefined);
  const request = vi.fn().mockResolvedValue({ release });
  Object.defineProperty(navigator, "wakeLock", {
    configurable: true,
    value: { request },
  });
  return { request, release };
}

afterEach(() => {
  Reflect.deleteProperty(navigator, "wakeLock");
});

describe("useScreenWakeLock", () => {
  test("도는 동안 화면 잠금을 잡고, 멈추면 놓는다", async () => {
    const { request, release } = stubWakeLock();

    const { rerender } = render(<Probe active={false} />);
    expect(request).not.toHaveBeenCalled();

    await act(async () => rerender(<Probe active />));
    expect(request).toHaveBeenCalledWith("screen");

    await act(async () => rerender(<Probe active={false} />));
    expect(release).toHaveBeenCalledTimes(1);
  });

  test("다른 곳에 다녀와 화면이 다시 보이면 잠금을 다시 잡는다", async () => {
    const { request } = stubWakeLock();
    await act(async () => {
      render(<Probe active />);
    });
    expect(request).toHaveBeenCalledTimes(1);

    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(request).toHaveBeenCalledTimes(2);
  });

  test("지원하지 않는 브라우저에서는 조용히 넘어간다", () => {
    expect(() => render(<Probe active />)).not.toThrow();
  });
});
