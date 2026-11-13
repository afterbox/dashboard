"use client";

import { useSyncExternalStore } from "react";
import { themeStorageKey } from "@/lib/hints";
import { themes, type Theme } from "@/lib/schemas";
import { useSavePreferences } from "@/store/session";

/**
 * Light · Dark · System (System is the default).
 *
 * The choice lives in two places: on the device (localStorage), which a script
 * in <head> reads before the first paint so the theme never flashes
 * (src/lib/hints.ts), and in the person's preferences, so it follows them to
 * another device (src/store/session.ts). It works by setting `data-theme` on
 * <html>; nothing set means System, and the tokens in globals.css do the rest.
 */

const listeners = new Set<() => void>();

const readTheme = (): Theme => {
  const set = document.documentElement.getAttribute("data-theme");
  return set === "light" || set === "dark" ? set : "system";
};

/** Put a theme on the page and remember it on this device. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
  try {
    if (theme === "system") localStorage.removeItem(themeStorageKey);
    else localStorage.setItem(themeStorageKey, theme);
  } catch {
    // Private browsing can refuse storage. The theme still applies for this visit.
  }
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

export const useTheme = () => useSyncExternalStore(subscribe, readTheme, () => "system" as Theme);

const labels: Record<Theme, string> = { light: "Light", dark: "Dark", system: "System" };

/** Small line drawings for the compact toggle: a sun, a moon, a screen. */
const icons: Record<Theme, React.ReactNode> = {
  light: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </>
  ),
  dark: <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z" />,
  system: (
    <>
      <rect x="4" y="5" width="16" height="11" rx="2" />
      <path d="M9 20h6M12 16v4" />
    </>
  ),
};

type Props = {
  /** `compact` shows the three as icons, for the header. Otherwise their names, for the settings sheet. */
  compact?: boolean;
  /** Also save the choice to their preferences. Off where nobody is signed in. */
  save?: boolean;
};

export function ThemeToggle({ compact = false, save = true }: Props) {
  const theme = useTheme();
  const { mutate: savePreference } = useSavePreferences();

  const choose = (next: Theme) => {
    applyTheme(next);
    // The device has it already. If saving fails, the page goes back to the theme that is saved.
    if (save) savePreference({ theme: next });
  };

  return (
    <fieldset>
      <legend className="sr-only">Theme</legend>
      <div className="inline-flex rounded-pill border border-line bg-paper p-0.5">
        {themes.map((option) => (
          <label
            key={option}
            title={compact ? labels[option] : undefined}
            className={`inline-flex min-h-10 cursor-pointer items-center justify-center rounded-pill text-label text-ink-muted transition-colors duration-200 ease-state hover:text-ink has-checked:bg-keepsake has-checked:text-linen has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus ${
              compact ? "w-10" : "px-4"
            }`}
          >
            <input
              type="radio"
              name={compact ? "theme-compact" : "theme"}
              value={option}
              checked={theme === option}
              onChange={() => choose(option)}
              className="sr-only"
            />
            {compact ? (
              <>
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden
                  className="size-5 fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.5]"
                >
                  {icons[option]}
                </svg>
                <span className="sr-only">{labels[option]}</span>
              </>
            ) : (
              labels[option]
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
