import type { ReactNode } from "react";

/**
 * The app's few icons: a rounded line at 1.5px on a 24px grid (design system,
 * "Imagery and iconography"). Only for things an icon says at a glance:
 * record, stop, play, record again, edit, an idea, back, close. Each is
 * decoration for a button that carries its own name (`IconButton` in ./ui.tsx),
 * so every one is hidden from screen readers.
 *
 * They draw in the current text colour, about 20px (`size-5`) unless told otherwise.
 */
type Props = { className?: string };

function Icon({ className = "size-5", filled = false, children }: Props & { filled?: boolean; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
      className={`shrink-0 ${
        filled ? "fill-current" : "fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.5]"
      } ${className}`}
    >
      {children}
    </svg>
  );
}

/** Record a voice note. */
export const MicIcon = (props: Props) => (
  <Icon {...props}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
  </Icon>
);

/** Stop recording. */
export const StopIcon = (props: Props) => (
  <Icon filled {...props}>
    <rect x="6" y="6" width="12" height="12" rx="2.5" />
  </Icon>
);

export const PlayIcon = (props: Props) => (
  <Icon filled {...props}>
    <path d="M8.5 5.6v12.8a.8.8 0 0 0 1.2.7l10.6-6.4a.8.8 0 0 0 0-1.4L9.7 4.9a.8.8 0 0 0-1.2.7z" />
  </Icon>
);

export const PauseIcon = (props: Props) => (
  <Icon filled {...props}>
    <rect x="6.5" y="5" width="4" height="14" rx="1.2" />
    <rect x="13.5" y="5" width="4" height="14" rx="1.2" />
  </Icon>
);

/** Do it again: record again, try again. */
export const AgainIcon = (props: Props) => (
  <Icon {...props}>
    <path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5" />
    <path d="M4.5 4v4.5H9" />
  </Icon>
);

/** Write, or change what is written. */
export const PencilIcon = (props: Props) => (
  <Icon {...props}>
    <path d="M4 20l1-4.5L16.5 4a2.1 2.1 0 0 1 3 3L8 18.5 4 20z" />
    <path d="M14.5 6l3 3" />
  </Icon>
);

/** An idea. */
export const IdeaIcon = (props: Props) => (
  <Icon {...props}>
    <path d="M9 17.5h6M10 20.5h4" />
    <path d="M8.5 14.5a6 6 0 1 1 7 0c-.6.5-1 1.2-1 2v1h-5v-1c0-.8-.4-1.5-1-2z" />
  </Icon>
);

/** Done: keep what was typed. */
export const CheckIcon = (props: Props) => (
  <Icon {...props}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icon>
);

export const BackIcon = (props: Props) => (
  <Icon {...props}>
    <path d="M14.5 6l-6 6 6 6" />
  </Icon>
);

export const CloseIcon = (props: Props) => (
  <Icon {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);
