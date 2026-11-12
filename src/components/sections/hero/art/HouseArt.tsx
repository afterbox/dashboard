import { Artboard } from "./Artboard";
import { Part } from "./Part";

/**
 * PLACEHOLDER. Layer 3 of the zoom: the family's house.
 * The window is a real opening in the wall, centred on the shared point, so the
 * kitchen (TableArt) shows through from the layer behind. Keep the opening
 * transparent in the final art. Everything outside the house is transparent too.
 *
 * Moving parts: the `bird` hops, and now and then flies to another perch (the
 * ridge, the chimney, the slope of the roof; `perches` lists them as offsets
 * from where it is drawn). Its `bird-head` turns about the pivot, so the beak
 * points the other way.
 */
export function HouseArt() {
  return (
    <Artboard
      landscape={
        <>
          <rect x="1190" y="176" width="46" height="96" className="fill-keepsake" />
          <polygon points="780,300 1055,140 1330,300" className="fill-heartwood" />

          <Part name="bird" perches="0,0 158,37 -125,73">
            <Part name="bird-body">
              <ellipse cx="1055" cy="127" rx="17" ry="12" className="fill-lantern" />
            </Part>
            <Part name="bird-head" pivot={[1065, 113]}>
              <polygon points="1071,109 1082,113 1071,117" className="fill-keepsake" />
              <circle cx="1065" cy="113" r="8" className="fill-lantern" />
            </Part>
            {/* bird */}
          </Part>

          {/* Wall, with the window cut out of it. */}
          <path
            fillRule="evenodd"
            d="M820 300H1290V700H820Z M1032 402H1144V498H1032Z"
            className="fill-paper"
          />
          {/* the house */}

          <rect x="880" y="548" width="92" height="152" rx="8" className="fill-keepsake" />
          <circle cx="954" cy="628" r="5" className="fill-lantern" />
          {/* door */}
          <rect x="866" y="700" width="120" height="12" rx="4" className="fill-paper" />
        </>
      }
      portrait={
        <>
          <rect x="590" y="226" width="56" height="116" className="fill-keepsake" />
          <polygon points="110,380 450,190 790,380" className="fill-heartwood" />

          <Part name="bird" perches="0,0 168,37 -150,84">
            <Part name="bird-body">
              <ellipse cx="450" cy="174" rx="21" ry="15" className="fill-lantern" />
            </Part>
            <Part name="bird-head" pivot={[462, 157]}>
              <polygon points="470,152 484,157 470,162" className="fill-keepsake" />
              <circle cx="462" cy="157" r="10" className="fill-lantern" />
            </Part>
            {/* bird */}
          </Part>

          <path
            fillRule="evenodd"
            d="M150 380H750V1000H150Z M396 516H504V636H396Z"
            className="fill-paper"
          />
          {/* the house */}

          <rect x="540" y="790" width="124" height="210" rx="10" className="fill-keepsake" />
          <circle cx="640" cy="900" r="7" className="fill-lantern" />
          {/* door */}
          <rect x="522" y="1000" width="160" height="14" rx="5" className="fill-paper" />
        </>
      }
    />
  );
}
