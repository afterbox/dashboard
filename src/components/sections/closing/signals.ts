import { createSignal } from "@/lib/signal";

/**
 * What the closing scene (section 10) tells the nav.
 *
 * `closingCta`: "Begin with someone you love" is showing, so the nav's pill
 * steps back and there is only ever one heartwood button in view (as with the
 * hero's own button; see ../hero/signals.ts).
 */
export const closingCta = createSignal();
