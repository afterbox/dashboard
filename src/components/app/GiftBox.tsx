import { ViewTransition, type CSSProperties } from "react";
import { EnvelopeArt, GiftBoxArt } from "./GiftBoxArt";
import "./app.css";

type Props = {
  /** Whose it is: written on the handwritten tag. No name yet, no tag. */
  name?: string | null;
  /** How many rings have been earned. One when someone is named, one more for each thing made. */
  rings?: number;
  /** `compact` sits above a question; `shelf` is one person on /home. */
  size?: "compact" | "shelf";
  /** Set to a new value each time something is sealed: the envelope drops in and the box glows, once. */
  sealing?: string | number | null;
  /**
   * This is the box that travels between pages (globals.css, "View
   * transitions"). Only one box on a page may.
   */
  travels?: boolean;
  className?: string;
};

/**
 * How far out each ring sits, with the box 100 wide. Up to three sit well
 * apart; more than that share the same space, closer together. Six at most:
 * past that the count is in the words beside the box, not in more rings.
 */
const maxRings = 6;
const radiiFor = (count: number) =>
  count <= 3 ? [76, 90, 104] : Array.from({ length: count }, (_, i) => 72 + (i * 36) / (count - 1));

/**
 * The gift box: the box itself, the rings it has earned, and the tag with
 * their name on it. Gift mode only.
 */
export function GiftBox({ name, rings = 0, size = "compact", sealing = null, travels = false, className = "" }: Props) {
  const shown = Math.min(rings, maxRings);
  const ringRadii = radiiFor(shown);
  const box = (
    <div className="absolute top-1/2 left-1/2 w-(--box) -translate-x-1/2 -translate-y-1/2">
      <GiftBoxArt />
    </div>
  );

  return (
    <div
      className={`gift-box ${className}`}
      data-size={size}
      data-named={name ? "" : undefined}
      data-sealing={sealing === null ? undefined : ""}
      style={{ "--rings": shown } as CSSProperties}
    >
      {/* rings */}
      <svg
        viewBox="-110 -110 220 220"
        aria-hidden
        focusable="false"
        className="absolute top-1/2 left-1/2 size-[calc(var(--box)*2.2)] -translate-x-1/2 -translate-y-1/2 fill-none"
      >
        {ringRadii.map((r, i) => (
          <circle
            key={r}
            r={r}
            className={`gift-ring [stroke-width:1.75px] [vector-effect:non-scaling-stroke] ${
              i % 2 === 0 ? "stroke-heartwood" : "stroke-lantern"
            }`}
            style={{ "--k": i + 1 } as CSSProperties}
          />
        ))}
      </svg>

      {/* The glow: once, briefly, when something is sealed. */}
      <div
        key={`glow-${sealing}`}
        aria-hidden
        className="gift-glow absolute top-1/2 left-1/2 h-[calc(var(--box)*0.62)] w-(--box) -translate-x-1/2 -translate-y-[38%] rounded-md shadow-glow"
      />

      {travels ? (
        <ViewTransition name="gift-box" share="gift-morph" update="gift-morph" default="none">
          {box}
        </ViewTransition>
      ) : (
        box
      )}

      {/* The envelope, on its way in. */}
      <div
        key={`envelope-${sealing}`}
        aria-hidden
        className="gift-envelope absolute top-[calc(50%-var(--box)*0.62)] left-[calc(50%-var(--box)*0.21)] w-[calc(var(--box)*0.42)]"
      >
        <EnvelopeArt />
      </div>

      {/* The tag: their name, as the person building the gift wrote it. */}
      <p
        aria-hidden={!name}
        className="gift-tag absolute top-[calc(50%+var(--box)*0.2)] left-[calc(50%+var(--box)*0.1)] flex max-w-36 origin-top-left -rotate-3 items-center gap-2 rounded-sm border border-line bg-paper py-0.5 pr-3 pl-2 font-note text-note text-ink shadow-rest"
      >
        <span aria-hidden className="size-1.5 shrink-0 rounded-pill border border-ink-muted bg-linen" />
        <span className="truncate">{name || "\u00A0"}</span>
      </p>
    </div>
  );
}
