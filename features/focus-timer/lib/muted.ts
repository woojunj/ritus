import { useSyncExternalStore } from "react";

const MUTED_STORAGE_KEY = "ritus:muted";

const mutedListeners = new Set<() => void>();

function subscribeMuted(callback: () => void): () => void {
  mutedListeners.add(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === MUTED_STORAGE_KEY || e.key === null) {
      callback();
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }
  return () => {
    mutedListeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function getMutedSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(MUTED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function getMutedServerSnapshot(): boolean {
  return false;
}

export function setMuted(next: boolean) {
  try {
    localStorage.setItem(MUTED_STORAGE_KEY, String(next));
  } catch {
    // Ignore
  }
  for (const listener of mutedListeners) {
    listener();
  }
}

export function useMuted(): boolean {
  return useSyncExternalStore(
    subscribeMuted,
    getMutedSnapshot,
    getMutedServerSnapshot
  );
}
