import { SealedBoard, SealedBox, SealedRings } from "./box/SealedBoxArt";
import { SealedStage } from "./lazy";
// The section's styles load with the page; its script comes later (./lazy.tsx).
import "./sealed/sealed.css";

/**
 * 5. "Sealed. Even from us.": trust.
 *
 * A keepsake band. The box from section 4 arrives with its lid part-closed;
 * the lid comes down, the box takes the weight, and the ribbon ties itself.
 * A key appears and splits into three pieces, one each for your executor, a
 * verified death certificate and afterbox: none can open it alone. Then the
 * three promises settle into place, in their exact words.
 *
 * Gift mode at its most solid. This section's motion is the click of a clasp:
 * short, exact state changes (`ease-state`), one after another. Nothing
 * bounces, nothing glows, and Biscuit isn't in it.
 *
 * On the band the art is cut out of it: shapes are outlined in keepsake, the
 * rings and the key are linen. That holds in Candlelight, where keepsake is a
 * light block and linen is dark.
 *
 * It ends with the box sealed and still, and one more ring starting to grow:
 * section 6 picks the years up from there.
 */
export function Sealed() {
  return (
    // Clipped at the sides only: the box's rings run wider than a phone.
    <section data-section="sealed" aria-labelledby="sealed-line" className="overflow-x-clip bg-keepsake text-linen">
      <SealedStage
        box={
          <SealedBoard line="stroke-keepsake">
            <SealedRings tone="stroke-linen/45" />
            <SealedBox contents />
          </SealedBoard>
        }
      />
    </section>
  );
}
