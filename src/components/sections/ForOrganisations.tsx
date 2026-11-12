import { SlowFade } from "./kitchen-table/SlowFade";
import { OrgPanel } from "./lazy";

/**
 * 9. "Give it to your people": for employers, insurers and banks.
 * Carries the "For organisations" anchor from the navigation and the footer.
 *
 * After two sections in Still mode the colour comes back, gently: a blush
 * band, and each example partner in a colour of its own. One panel with
 * three tabs, never three cards side by side (./organisations/OrgPanel.tsx).
 * Under it, the one action for this reader: "Talk to us".
 *
 * Motion: the panel arrives with a single fade. Inside it, only the chosen
 * tab's marker slides and the words cross-fade. Nothing else moves.
 */
export function ForOrganisations() {
  return (
    <section
      id="organisations"
      data-section="for-organisations"
      aria-labelledby="organisations-line"
      className="scroll-mt-16 bg-blush md:scroll-mt-18"
    >
      <div className="mx-auto w-full max-w-300 px-5 pt-20 pb-20 md:px-6 lg:pt-24 lg:pb-24">
        <h2
          id="organisations-line"
          className="font-display text-display-l-mobile text-balance text-ink md:text-display-l"
        >
          Give it to your people.
        </h2>
        <p className="mt-5 max-w-xl text-body-l-mobile text-pretty text-ink-muted md:text-body-l">
          Employers, insurers and banks can offer afterbox to the people they look after: as a benefit, or
          inside their own app.
        </p>

        <SlowFade className="mt-10 md:mt-12">
          <OrgPanel />
        </SlowFade>
      </div>
    </section>
  );
}
