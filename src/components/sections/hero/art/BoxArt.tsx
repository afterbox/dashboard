import { Artboard } from "./Artboard";

/**
 * PLACEHOLDER. The last layer: the keepsake box, tied with a lantern ribbon,
 * sitting on the shared centre point. The handwritten note is live text laid
 * over it (BoxAndNote.tsx), so leave the tag out of the final art.
 */
export function BoxArt() {
  return (
    <Artboard
      landscape={
        <>
          <rect x="948" y="420" width="280" height="160" rx="16" className="fill-paper" />
          <rect x="938" y="368" width="300" height="64" rx="14" className="fill-paper" />
          <rect x="1072" y="368" width="32" height="212" className="fill-lantern" />
          <ellipse cx="1056" cy="352" rx="36" ry="20" transform="rotate(-18 1056 352)" className="fill-lantern" />
          <ellipse cx="1120" cy="352" rx="36" ry="20" transform="rotate(18 1120 352)" className="fill-lantern" />
          <circle cx="1088" cy="360" r="13" className="fill-lantern" />
          {/* the box */}
        </>
      }
      portrait={
        <>
          <rect x="272" y="546" width="356" height="204" rx="20" className="fill-paper" />
          <rect x="258" y="480" width="384" height="80" rx="18" className="fill-paper" />
          <rect x="430" y="480" width="40" height="270" className="fill-lantern" />
          <ellipse cx="410" cy="460" rx="46" ry="26" transform="rotate(-18 410 460)" className="fill-lantern" />
          <ellipse cx="490" cy="460" rx="46" ry="26" transform="rotate(18 490 460)" className="fill-lantern" />
          <circle cx="450" cy="470" r="16" className="fill-lantern" />
          {/* the box */}
        </>
      }
    />
  );
}
