import { BoxArt } from "./hero/art/BoxArt";
import { HouseArt } from "./hero/art/HouseArt";
import { StreetArt } from "./hero/art/StreetArt";
import { TableArt } from "./hero/art/TableArt";
import { WindowArt } from "./hero/art/WindowArt";
import { FinalStage } from "./lazy";
// The section's styles load with the page; its script comes later (./lazy.tsx).
import "./hero/hero.css";

/**
 * 10. The final scene: the zoom back out. The hero's bookend.
 *
 * It opens where the hero ended, on the box in its rings with Dad's note, and
 * pulls back: out past the family at the table, through the window, to the
 * house at night with every light on and Biscuit, old now, on the doorstep.
 * Then one line and one button: "Begin with someone you love".
 *
 * The hero's own layers and camera, run backwards (./closing/FinalStage.tsx).
 * The art is the hero's with `night` set.
 */
export function FinalScene() {
  return (
    <section data-section="final-scene" aria-labelledby="closing-line">
      <FinalStage
        street={<StreetArt night />}
        house={<HouseArt night />}
        windowFrame={<WindowArt />}
        table={<TableArt night />}
        box={<BoxArt />}
      />
    </section>
  );
}
