import { createBrowserStore } from "@/lib/browser-store";

export type MemoFormat = "txt" | "md";

export type MemoDoc = {
  text: string;
  format: MemoFormat;
};

const EMPTY_DOC: MemoDoc = { text: "", format: "txt" };
const store = createBrowserStore<MemoDoc>({
  key: "ritus:memo",
  empty: EMPTY_DOC,
  parse: (raw) => raw ? { ...EMPTY_DOC, ...JSON.parse(raw) as Partial<MemoDoc> } : EMPTY_DOC,
  readError: "cached",
});

export const subscribeMemo = store.subscribe;
export const getMemoSnapshot = store.getSnapshot;
export const getMemoServerSnapshot = store.getServerSnapshot;
export const saveMemo = store.save;
