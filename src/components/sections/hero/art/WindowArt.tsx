import { Artboard } from "./Artboard";
import { Part } from "./Part";

/**
 * PLACEHOLDER. Layer 4 of the zoom, nearest the camera: the lit window.
 * Frame, one glazing bar, sill and a wash of lamplight over the glass.
 * The glass stays see-through and the bar sits above centre, so the camera
 * has a clear path to the table.
 *
 * Moving part: `window-light`, the wash of lamplight, flickers very softly.
 */
export function WindowArt() {
  return (
    <Artboard
      landscape={
        <>
          <Part name="window-light">
            <rect x="1032" y="402" width="112" height="96" className="fill-lantern/35 stroke-none" />
          </Part>
          <path
            fillRule="evenodd"
            d="M1022 392H1154V508H1022Z M1032 402H1144V498H1032Z"
            className="fill-linen"
          />
          <rect x="1032" y="430" width="112" height="6" className="fill-linen" />
          <rect x="1012" y="508" width="152" height="12" rx="4" className="fill-heartwood" />
          {/* lit window */}
        </>
      }
      portrait={
        <>
          <Part name="window-light">
            <rect x="396" y="516" width="108" height="120" className="fill-lantern/35 stroke-none" />
          </Part>
          <path
            fillRule="evenodd"
            d="M384 504H516V648H384Z M396 516H504V636H396Z"
            className="fill-linen"
          />
          <rect x="396" y="551" width="108" height="7" className="fill-linen" />
          <rect x="372" y="648" width="156" height="14" rx="5" className="fill-heartwood" />
          {/* lit window */}
        </>
      }
    />
  );
}
