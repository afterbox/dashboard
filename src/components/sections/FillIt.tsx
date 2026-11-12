import { BoxBack, BoxFront, BoxRings } from "./box/BoxSceneArt";
import { FillStage } from "./fill-it/FillStage";
import { HandOffNote } from "./fill-it/HandOffNote";

/**
 * 3. "Fill it, a little at a time": the playful demo.
 * Carries the "How it works" anchor from the navigation.
 *
 * The box from the hero and section 2, open, with Biscuit beside it. Four
 * beats scroll past it (accounts, pensions and policies, crypto, wishes), and
 * in each a product card drops into the box: the box squashes as it catches
 * it, a ring grows, it glows once, and a line says what that means for the
 * people it's for. Biscuit's ear lifts when a card appears and he wags when
 * it lands; on the last one, about him, he sits up.
 *
 * Gift mode, and the page's playful moment: the colour comes back after the
 * quiet of section 2, and this is the one section where things bounce
 * (`ease-play`). The joy is in the reactions, one at a time.
 *
 * It ends on a handwritten card that lies across the edge of section 4.
 */
export function FillIt() {
  return (
    // Clipped at the sides only: the flying cards are placed by transform, and must never widen the page.
    <section id="how-it-works" data-section="fill-it" aria-labelledby="fill-it-line" className="overflow-x-clip bg-linen">
      <FillStage rings={<BoxRings />} back={<BoxBack />} front={<BoxFront />} />
      <HandOffNote />
    </section>
  );
}
