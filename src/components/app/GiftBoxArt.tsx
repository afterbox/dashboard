/**
 * PLACEHOLDER. The keepsake box, tied with a lantern ribbon: the same box, to
 * the same measure, as the one the landing page's hero ends on
 * (sections/hero/art/BoxArt.tsx, landscape artboard). Here it is cut to its own
 * bounds so it can be placed anywhere: at the top of onboarding, and once per
 * person on /home.
 *
 * Because the two are the same shape, the box can travel between pages as one
 * object (globals.css, "View transitions"). When the commissioned box arrives,
 * replace both together and keep this viewBox.
 *
 * Simple shapes only, in palette colours. Part names are in the code, not on screen.
 */
export const giftBoxBounds = { x: 934, y: 326, width: 308, height: 258 } as const;

const { x, y, width, height } = giftBoxBounds;

export function GiftBoxArt({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox={`${x} ${y} ${width} ${height}`}
      aria-hidden
      focusable="false"
      className={`block h-auto w-full stroke-ink [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.5px] *:[vector-effect:non-scaling-stroke] ${className}`}
    >
      {/* box */}
      <rect x="948" y="420" width="280" height="160" rx="16" className="fill-paper" />
      {/* box-lid */}
      <rect x="938" y="368" width="300" height="64" rx="14" className="fill-paper" />
      {/* ribbon */}
      <rect x="1072" y="368" width="32" height="212" className="fill-lantern" />
      {/* bow-loop, twice */}
      <ellipse cx="1056" cy="352" rx="36" ry="20" transform="rotate(-18 1056 352)" className="fill-lantern" />
      <ellipse cx="1120" cy="352" rx="36" ry="20" transform="rotate(18 1120 352)" className="fill-lantern" />
      {/* bow-knot */}
      <circle cx="1088" cy="360" r="13" className="fill-lantern" />
    </svg>
  );
}

/**
 * PLACEHOLDER. A sealed envelope: a paper rectangle, its flap, and a lantern seal.
 */
export function EnvelopeArt({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 44"
      aria-hidden
      focusable="false"
      className={`block h-auto w-full fill-none stroke-ink [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.5px] *:[vector-effect:non-scaling-stroke] ${className}`}
    >
      {/* envelope */}
      <rect x="2" y="2" width="60" height="40" rx="6" className="fill-paper" />
      {/* envelope-flap */}
      <path d="M4 6 32 26 60 6" />
      {/* envelope-seal */}
      <circle cx="32" cy="27" r="5" className="fill-lantern" />
    </svg>
  );
}
