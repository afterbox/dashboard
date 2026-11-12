import { SealedBoard, SealedBox } from "./box/SealedBoxArt";
import { BiscuitAt } from "./grows/BiscuitAges";
import { GrowsStage } from "./lazy";
// The section's styles load with the page; its script comes later (./lazy.tsx).
import "./grows/grows.css";

/**
 * 6. "It grows with you": the come-back loop.
 *
 * Back on linen, with the full palette. The box from section 5 is sealed and
 * tied, and the rings around it are now the years: one grows for each, and
 * its year is written on it. Every other year afterbox has noticed something
 * (a home, a birthday, a new pension payment) and asks about it in a small
 * card that pops in; the years between are the yearly check-in, with nothing
 * to do. Biscuit is a puppy beside the box, grown a few years on, and grey
 * round the muzzle by the end.
 *
 * Gift mode: a steady rhythm of ring after ring, and the cards pop in with
 * the one small overshoot. It ends on a line by itself, "And one day…".
 */
export function GrowsWithYou() {
  return (
    // Clipped at the sides only: the rings run far wider than the screen.
    <section data-section="grows-with-you" aria-labelledby="grows-line" className="overflow-x-clip bg-linen">
      <GrowsStage
        box={
          <SealedBoard>
            <SealedBox />
          </SealedBoard>
        }
        biscuit={{
          puppy: <BiscuitAt age="puppy" />,
          grown: <BiscuitAt age="grown" />,
          old: <BiscuitAt age="old" />,
        }}
      />
    </section>
  );
}
