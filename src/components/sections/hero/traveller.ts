import { useEffect, useId, useSyncExternalStore } from "react";

/**
 * The page draws the gift box twice: at the end of the hero, and again in the
 * closing scene. When "Build their gift" is pressed, one box travels into
 * onboarding, and the browser needs exactly one to carry. Each box asks here
 * while it is the one on screen; the last to ask is the one that travels.
 */
const asking: string[] = [];
const listeners = new Set<() => void>();
const tell = () => listeners.forEach((notify) => notify());

const subscribe = (notify: () => void) => {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
};

/** True for the one box that travels, while `onScreen` is true for it. */
export function useTravels(onScreen: boolean) {
  const id = useId();

  useEffect(() => {
    if (!onScreen) return;
    asking.push(id);
    tell();
    return () => {
      asking.splice(asking.indexOf(id), 1);
      tell();
    };
  }, [onScreen, id]);

  return useSyncExternalStore(
    subscribe,
    () => asking.at(-1) === id,
    () => false,
  );
}
