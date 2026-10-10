import { render, screen, fireEvent, act, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { AppShell } from "@/app/_components/app-shell";
import MemoPage from "@/app/memo/page";
import Home from "@/app/page";
import TodosPage from "@/app/todos/page";
import { saveItems, loadItems } from "@/features/todo-list";

// 주소에 맞는 화면을 공통 틀 안에 그려 실제 화면 이동을 흉내 낸다.
let pathname = "/";
let rerenderApp: () => void = () => {};

function navigate(next: string) {
  pathname = next;
  rerenderApp();
}

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: (href: string) => navigate(href) }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    onClick,
    children,
    ...rest
  }: React.ComponentProps<"a"> & { href: string }) => (
    <a
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) {
          e.preventDefault();
          navigate(href);
        }
      }}
      {...rest}
    >
      {children}
    </a>
  ),
}));

vi.mock("@/features/focus-timer/lib/chime", () => ({
  playChime: vi.fn(),
}));

function App() {
  return (
    <AppShell>
      {pathname === "/memo" ? (
        <MemoPage />
      ) : pathname === "/todos" ? (
        <TodosPage />
      ) : (
        <Home />
      )}
    </AppShell>
  );
}

function renderApp(start = "/") {
  pathname = start;
  const view = render(<App />);
  rerenderApp = () => act(() => view.rerender(<App />));
  return view;
}

function goTo(label: "타이머" | "메모장" | "할 일 목록") {
  const nav = screen.getByRole("navigation", { name: "화면 이동" });
  fireEvent.click(within(nav).getByRole("link", { name: label }));
}

function seedTodos() {
  saveItems([
    { id: "a", title: "알고리즘 문제 풀이", completionCount: 0, createdAt: 1 },
    { id: "b", title: "보고서 초안", completionCount: 0, createdAt: 2 },
  ]);
}

function setMinutes(value: string) {
  const input = screen.getByLabelText("시간(분)");
  fireEvent.change(input, { target: { value } });
  fireEvent.blur(input);
}

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
});

afterEach(() => {
  act(() => {
    vi.runOnlyPendingTimers();
  });
  vi.useRealTimers();
});

describe("내비게이션", () => {
  test("세 화면 모두 같은 순서의 세 아이콘이 있고 현재 화면이 표시된다", () => {
    renderApp();

    for (const [label, marker] of [
      ["타이머", () => screen.getByLabelText("세션 제목")],
      ["메모장", () => screen.getByLabelText("메모 본문")],
      ["할 일 목록", () => screen.getByLabelText("새 할 일")],
    ] as const) {
      goTo(label);
      expect(marker()).toBeInTheDocument();

      const nav = screen.getByRole("navigation", { name: "화면 이동" });
      const links = within(nav).getAllByRole("link");
      expect(links.map((link) => link.getAttribute("aria-label"))).toEqual([
        "타이머",
        "메모장",
        "할 일 목록",
      ]);
      expect(
        links.filter((link) => link.getAttribute("aria-current") === "page")
      ).toEqual([within(nav).getByRole("link", { name: label })]);
      expect(screen.getByRole("button", { name: "소리 끄기" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /테마 선택/ })).toBeInTheDocument();
    }
  });

  test("옛 이동 수단(메모장 닫기, 타이머로 돌아가기)은 없다", () => {
    renderApp("/memo");
    expect(screen.queryByRole("button", { name: "메모장 닫기" })).toBeNull();

    goTo("할 일 목록");
    expect(screen.queryByLabelText("타이머로 돌아가기")).toBeNull();
    expect(screen.queryByLabelText("타이머 화면으로 이동")).toBeNull();
  });
});

describe("세션 유지", () => {
  test("세션 중에 메모장과 할 일 목록으로 옮겨도 시간이 이어진다", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "시작" }));

    goTo("메모장");
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(screen.getByRole("timer")).toHaveTextContent("24:55");

    goTo("할 일 목록");
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(screen.getByRole("timer")).toHaveTextContent("24:50");
    expect(document.title).toBe("24:50");

    goTo("타이머");
    expect(screen.getByRole("timer")).toHaveTextContent("24:50");
  });

  test("세션이 없을 때 할 일 목록에는 한 줄 바가 없고, 메모장에는 시작 아이콘이 있다", () => {
    renderApp("/todos");
    expect(screen.queryByRole("timer")).toBeNull();

    goTo("메모장");
    expect(screen.getByRole("timer")).toHaveTextContent("25:00");
    fireEvent.click(screen.getByRole("button", { name: "시작" }));
    expect(screen.getByLabelText("메모 본문")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "일시정지" })).toBeInTheDocument();
  });
});

describe("할 일에서 타이머 시작", () => {
  test("세션이 없으면 묻지 않고 그 제목의 설정 화면으로 가고, 완주하면 완주 횟수가 오른다", () => {
    seedTodos();
    renderApp("/todos");

    fireEvent.click(
      screen.getByRole("link", { name: '"알고리즘 문제 풀이" 타이머 시작' })
    );
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.getByLabelText("세션 제목")).toHaveValue("알고리즘 문제 풀이");

    setMinutes("1");
    fireEvent.click(screen.getByRole("button", { name: "시작" }));
    goTo("메모장");
    expect(loadItems().find((item) => item.id === "a")?.completionCount).toBe(0);

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(loadItems().find((item) => item.id === "a")?.completionCount).toBe(1);
    expect(loadItems().find((item) => item.id === "b")?.completionCount).toBe(0);
  });

  test("세션 중에 다른 할 일을 누르면 확인을 받고, 취소하면 세션이 그대로 돈다", () => {
    seedTodos();
    renderApp("/todos");
    fireEvent.click(
      screen.getByRole("link", { name: '"알고리즘 문제 풀이" 타이머 시작' })
    );
    setMinutes("1");
    fireEvent.click(screen.getByRole("button", { name: "시작" }));
    goTo("할 일 목록");

    fireEvent.click(screen.getByRole("link", { name: '"보고서 초안" 타이머 시작' }));
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveTextContent("지금 세션을 그만두고 새로 시작할까요?");

    fireEvent.click(within(dialog).getByRole("button", { name: "취소" }));
    expect(screen.getByLabelText("새 할 일")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "일시정지" })).toBeInTheDocument();

    // 취소한 뒤 완주하면 처음 고른 할 일에 횟수가 오른다.
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(loadItems().find((item) => item.id === "a")?.completionCount).toBe(1);
    expect(loadItems().find((item) => item.id === "b")?.completionCount).toBe(0);
  });

  test("확인하면 지금 세션이 끝나고 누른 할 일의 설정 화면으로 간다", () => {
    seedTodos();
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "시작" }));
    goTo("할 일 목록");

    fireEvent.click(screen.getByRole("link", { name: '"보고서 초안" 타이머 시작' }));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "확인" })
    );

    expect(screen.getByLabelText("세션 제목")).toHaveValue("보고서 초안");
    expect(screen.getByRole("button", { name: "시작" })).toBeInTheDocument();
  });

  test("지금 세션을 시작한 할 일을 다시 누르면 묻지 않고 진행 중인 타이머로 간다", () => {
    seedTodos();
    renderApp("/todos");
    fireEvent.click(
      screen.getByRole("link", { name: '"알고리즘 문제 풀이" 타이머 시작' })
    );
    fireEvent.click(screen.getByRole("button", { name: "시작" }));
    goTo("할 일 목록");

    fireEvent.click(
      screen.getByRole("link", { name: '"알고리즘 문제 풀이" 타이머 시작' })
    );
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.getByRole("button", { name: "일시정지" })).toBeInTheDocument();
    expect(screen.queryByLabelText("새 할 일")).toBeNull();
  });

  test("세션 중에도 할 일 추가는 확인 없이 된다", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "시작" }));
    goTo("할 일 목록");

    fireEvent.change(screen.getByLabelText("새 할 일"), {
      target: { value: "새로 생각난 일" },
    });
    fireEvent.click(screen.getByRole("button", { name: "할 일 추가" }));
    expect(screen.getByText("새로 생각난 일")).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
});
