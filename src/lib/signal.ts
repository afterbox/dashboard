import { useSyncExternalStore } from "react";

/**
 * One true-or-false fact that one part of the page sets and another reads
 * (the hero tells the nav what is on screen).
 *
 * `set` is safe to call from anywhere, including while React is rendering (a
 * scroll value can recalculate mid-render). The change lands just after, never
 * during.
 */
export function createSignal() {
  let value = false;
  let latest = false;
  let queued = false;
  const listeners = new Set<() => void>();

  const set = (next: boolean) => {
    latest = next;
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      if (latest === value) return;
      value = latest;
      listeners.forEach((notify) => notify());
    });
  };

  const subscribe = (notify: () => void) => {
    listeners.add(notify);
    return () => {
      listeners.delete(notify);
    };
  };

  const useValue = () =>
    useSyncExternalStore(
      subscribe,
      () => value,
      () => false,
    );

  return { set, useValue };
}
