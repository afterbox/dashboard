import { SlowFade } from "./kitchen-table/SlowFade";
import { OpeningScene } from "./lazy";
import { JoPhone } from "./opening/JoPhone";
import { OpeningArt } from "./opening/OpeningArt";
// The section's styles load with the page; its script comes later (./lazy.tsx).
import "./opening/opening.css";

/**
 * 7. "When the time comes": the opening. Still mode begins here.
 *
 * The same linen as section 6, with no edge between them: "And one day…" is
 * answered quietly. Mary, grown up, receives a gentle message; the lid lifts,
 * slowly, and her letter rises out. Beside it, a phone shows the guide Jo
 * gets: care first, what's done, the letters already written.
 *
 * Still mode: no gold, no glow, no bounce. Biscuit is an old dog resting by
 * the door, and nobody moves. Everything is a slow fade, except the lid: the
 * one signature moment, once (see ./opening/opening.css).
 *
 * It ends on a quiet line for anyone who has already lost someone, which
 * section 8 answers.
 */
export function WhenTheTimeComes() {
  return (
    <section data-section="when-the-time-comes" aria-labelledby="opening-line" className="bg-linen">
      <div className="mx-auto w-full max-w-300 px-5 pb-20 md:px-6 lg:grid lg:grid-cols-12 lg:gap-x-6 lg:pb-28">
        <SlowFade className="lg:col-span-7 lg:row-start-1">
          <h2
            id="opening-line"
            className="font-display max-w-xl text-display-l-mobile text-balance text-ink md:text-display-l"
          >
            When the time comes, it opens for them.
          </h2>
          <p className="mt-5 max-w-lg text-body-l-mobile text-pretty text-ink-muted md:text-body-l">
            Sealed until it&apos;s needed. Then everyone you named hears from us, gently, and sees only what you
            left for them.
          </p>
        </SlowFade>

        <OpeningScene
          landscape={<OpeningArt shape="landscape" />}
          portrait={<OpeningArt shape="portrait" />}
          className="mt-10 h-[min(76svh,38rem)] min-h-104 lg:col-span-7 lg:row-start-2 lg:mt-12 lg:h-auto lg:min-h-136"
        />

        <SlowFade className="mt-16 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:mt-0 lg:self-end lg:pl-6">
          <h3 className="font-display max-w-sm text-display-s-mobile text-balance text-ink md:text-display-s">
            And Jo knows where to start.
          </h3>
          <p className="mt-3 max-w-sm text-body text-pretty text-ink-muted">
            The person you chose to sort things out gets a calm guide: what to do first, the letters already
            written, and nothing to work out alone.
          </p>
        </SlowFade>

        <SlowFade className="mt-8 flex justify-center lg:col-span-5 lg:col-start-8 lg:row-start-2 lg:mt-12 lg:justify-start lg:pl-6">
          <JoPhone />
        </SlowFade>

        {/* The hand-off: for anyone reading who is already there. */}
        <SlowFade slower className="pt-24 lg:col-span-12 lg:pt-32">
          <p className="font-display text-display-s-mobile text-balance text-ink-muted md:text-display-s">
            Already lost someone? We can help now.
          </p>
        </SlowFade>
      </div>
    </section>
  );
}
