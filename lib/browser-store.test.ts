import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { createBrowserStore, getSaveFailureSnapshot, retryFailedSaves } from "./browser-store";

const KEY = "test:browser-store";
function makeStore(readError: "empty" | "cached" = "empty", key = KEY) {
  return createBrowserStore<string[]>({
    key,
    empty: [],
    parse: (raw) => raw ? JSON.parse(raw) : [],
    readError,
  });
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  vi.restoreAllMocks();
  retryFailedSaves();
});

describe("브라우저 저장 장치", () => {
  test("저장값이 같으면 스냅샷 참조를 유지하고 서버는 늘 같은 빈 값을 돌려준다", () => {
    localStorage.setItem(KEY, '["처음"]');
    const store = makeStore();
    const first = store.getSnapshot();
    expect(store.getSnapshot()).toBe(first);
    expect(store.getServerSnapshot()).toEqual([]);
    expect(store.getServerSnapshot()).toBe(store.getServerSnapshot());
    store.save(["다음"]);
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(["다음"]);
    expect(store.getSnapshot()).toEqual(["다음"]);
  });

  test("같은 화면의 저장과 다른 탭의 변경·전체 삭제를 알리고 구독 해제 뒤에는 알리지 않는다", () => {
    const store = makeStore();
    const changed = vi.fn();
    const unsubscribe = store.subscribe(changed);
    store.save(["저장"]);
    expect(changed).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new StorageEvent("storage", { key: "다른 키" }));
    expect(changed).toHaveBeenCalledTimes(1);
    localStorage.setItem(KEY, '["다른 탭"]');
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
    expect(store.getSnapshot()).toEqual(["다른 탭"]);
    localStorage.clear();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
    expect(store.getSnapshot()).toEqual([]);
    expect(changed).toHaveBeenCalledTimes(3);
    unsubscribe();
    store.save(["구독 해제 뒤"]);
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
    expect(changed).toHaveBeenCalledTimes(3);
  });

  test("읽기가 막혀도 빈 스냅샷 참조는 바뀌지 않는다", () => {
    const store = makeStore();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("차단"); });
    expect(store.getSnapshot()).toBe(store.getServerSnapshot());
    expect(store.getSnapshot()).toBe(store.getSnapshot());
  });

  test("손상된 JSON은 빈 값 또는 마지막 캐시라는 기능별 읽기 정책을 따른다", () => {
    const emptyStore = makeStore();
    const cachedStore = makeStore("cached");
    emptyStore.save(["보관"]);
    expect(cachedStore.getSnapshot()).toEqual(["보관"]);
    localStorage.setItem(KEY, "{손상");
    expect(emptyStore.getSnapshot()).toEqual([]);
    expect(cachedStore.getSnapshot()).toEqual(["보관"]);
    localStorage.setItem(KEY, '["복구"]');
    expect(emptyStore.getSnapshot()).toEqual(["복구"]);
    expect(cachedStore.getSnapshot()).toEqual(["복구"]);
  });

  test("저장 실패는 알리되 최신 값을 남기고, 재시도하면 그 값을 저장한다", () => {
    const store = makeStore();
    store.save(["이전"]);
    const changed = vi.fn();
    const unsubscribe = store.subscribe(changed);
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("용량 초과"); });
    expect(store.save(["현재"])).toBe(false);
    expect(getSaveFailureSnapshot()).toBe(true);
    expect(store.getSnapshot()).toEqual(["현재"]);
    expect(changed).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(["이전"]);
    store.save(["마지막 수정"]);
    setItem.mockRestore();
    retryFailedSaves();
    expect(getSaveFailureSnapshot()).toBe(false);
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(["마지막 수정"]);
    unsubscribe();
  });

  test("첫 저장과 읽기가 모두 막혀도 입력을 유지한다", () => {
    const store = makeStore();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("차단"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("차단"); });
    expect(store.save(["처음 쓴 글"])).toBe(false);
    expect(store.getSnapshot()).toEqual(["처음 쓴 글"]);
  });

  test("일부만 저장됐을 때는 경고를 유지하고 실패한 것만 다시 저장한다", () => {
    const first = makeStore("cached", "test:first");
    const second = makeStore("cached", "test:second");
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("차단"); });
    first.save(["첫째"]);
    second.save(["둘째"]);
    setItem.mockRestore();
    expect(first.save(["첫째 수정"])).toBe(true);
    expect(getSaveFailureSnapshot()).toBe(true);
    retryFailedSaves();
    expect(getSaveFailureSnapshot()).toBe(false);
    expect(JSON.parse(localStorage.getItem("test:first")!)).toEqual(["첫째 수정"]);
    expect(JSON.parse(localStorage.getItem("test:second")!)).toEqual(["둘째"]);
  });
});
