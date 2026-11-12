import { KitchenNightArt } from "./kitchen-table/KitchenNightArt";
import { SlowFade } from "./kitchen-table/SlowFade";
import { KitchenStage, SearchBar } from "./lazy";
// The section's styles load with the page; its script comes later (./lazy.tsx).
import "./kitchen-table/kitchen-table.css";

/** The two facts. */
const facts = ["About 400 hours of admin work", "£15B in unclaimed UK assets"] as const;

// One beat of the story. Beside the scene, each is given most of a screen and sits in the middle of it.
const beat = "beside:flex beside:min-h-[72svh] beside:flex-col beside:justify-center";

/**
 * 2. "The kitchen table": the problem, told gently.
 *
 * The same kitchen as the hero, later, at night. Four beats scroll past it:
 * the opening line, the search bar (typing: this section's motion signature),
 * two facts, and the turn. On the turn the scattered papers fly into the box,
 * which is where section 3 picks up.
 *
 * Quieter than the rest of the page: keepsake and linen only. No lantern, no
 * glow, no `ease-play`. The lamp flickers, and Mary's mum and Biscuit breathe;
 * that is all.
 */
export function KitchenTable() {
  return (
    <section id="kitchen-table" data-section="kitchen-table" aria-labelledby="kitchen-table-line" className="bg-linen">
      <KitchenStage art={<KitchenNightArt />}>
        <div className="pt-10 pb-20 beside:flex beside:min-h-(--kt-h) beside:flex-col beside:justify-center beside:py-0">
          <h2
            id="kitchen-table-line"
            className="font-display text-display-m-mobile text-pretty text-ink md:text-display-m low:text-display-m-mobile!"
          >
            {/* One block per sentence: one idea per line. */}
            <span className="block">Picture the person you love most, three days after losing you.</span>{" "}
            <span className="mt-4 block low:mt-3">Sitting at the kitchen table, not knowing where to begin.</span>
          </h2>
        </div>

        <div className={`py-16 ${beat}`}>
          <p className="mb-5 text-center text-body-l-mobile text-ink-muted md:text-body-l beside:text-left">
            They search. They guess. They miss things.
          </p>
          <SearchBar />
        </div>

        <div className={`py-16 ${beat}`}>
          <ul className="flex flex-col gap-10 lg:gap-12">
            {facts.map((fact) => (
              <li key={fact}>
                <SlowFade>
                  <p className="font-display text-display-m-mobile text-balance text-ink min-[375px]:text-display-l-mobile md:text-display-l low:text-display-l-mobile!">
                    {fact}
                  </p>
                </SlowFade>
              </li>
            ))}
          </ul>
        </div>

        {/* The turn, on its own, with quiet around it. The hand-off follows this line up the screen. */}
        <div className="py-[30svh] beside:flex beside:min-h-svh beside:flex-col beside:justify-center beside:py-0">
          <SlowFade slower>
            <p
              data-turn
              className="font-display text-display-l-mobile text-balance text-ink md:text-display-l low:text-display-l-mobile!"
            >
              It doesn&apos;t have to be this way.
            </p>
          </SlowFade>
        </div>
      </KitchenStage>
    </section>
  );
}
