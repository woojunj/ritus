import { createBrowserStore } from "@/lib/browser-store";

import { EMPTY_LIBRARY, normalizeLibrary, type MemoLibrary } from "./library";

const store = createBrowserStore<MemoLibrary>({
  key: "ritus:memo-library",
  empty: EMPTY_LIBRARY,
  parse: (raw) => raw ? normalizeLibrary(JSON.parse(raw)) : EMPTY_LIBRARY,
  readError: "cached",
  writeMode: "memory",
});

export const subscribeLibrary = store.subscribe;
export const getLibrarySnapshot = store.getSnapshot;
export const getLibraryServerSnapshot = store.getServerSnapshot;
export const saveLibrary = store.save;
