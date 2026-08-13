"use client";

import { useCallback, useSyncExternalStore } from "react";

type Listener = () => void;
type CacheEntry<T> = { raw: string | null; parsed: T };

const listenersByKey = new Map<string, Set<Listener>>();
const cacheByKey = new Map<string, CacheEntry<unknown>>();

function getListeners(key: string) {
  let listeners = listenersByKey.get(key);
  if (!listeners) {
    listeners = new Set();
    listenersByKey.set(key, listeners);
  }
  return listeners;
}

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Parses lazily and caches by raw string, so repeated snapshots stay reference-stable. */
function readValue<T>(key: string, initialValue: T): T {
  const raw = readRaw(key);
  const cached = cacheByKey.get(key) as CacheEntry<T> | undefined;
  if (cached && cached.raw === raw) return cached.parsed;

  let parsed = initialValue;
  if (raw !== null) {
    try {
      parsed = JSON.parse(raw) as T;
    } catch {
      parsed = initialValue;
    }
  }
  cacheByKey.set(key, { raw, parsed });
  return parsed;
}

/**
 * Same-shaped state as useState, backed by localStorage and shared across
 * every component reading the same key. Reads go through useSyncExternalStore
 * so the server snapshot (initialValue) and the client snapshot stay
 * consistent without any state-syncing effects.
 */
export function useLocalStorageState<T>(key: string, initialValue: T) {
  const subscribe = useCallback(
    (onStoreChange: Listener) => {
      const listeners = getListeners(key);
      listeners.add(onStoreChange);
      return () => listeners.delete(onStoreChange);
    },
    [key],
  );

  const getSnapshot = useCallback(
    () => readValue(key, initialValue),
    [key, initialValue],
  );
  const getServerSnapshot = useCallback(() => initialValue, [initialValue]);

  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setState = useCallback(
    (updater: T | ((prev: T) => T)) => {
      const prev = readValue(key, initialValue);
      const next =
        typeof updater === "function"
          ? (updater as (p: T) => T)(prev)
          : updater;
      const raw = JSON.stringify(next);
      try {
        window.localStorage.setItem(key, raw);
      } catch {
        // Ignore write failures (e.g. private browsing storage limits).
      }
      cacheByKey.set(key, { raw, parsed: next });
      getListeners(key).forEach((listener) => listener());
    },
    [key, initialValue],
  );

  return [state, setState] as const;
}
