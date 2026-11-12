import { createSignal } from "@/lib/signal";

/**
 * What section 3 tells the nav.
 *
 * `addItShown`: the "Add it" button in the demo is on screen. It is drawn in
 * heartwood, as it will be in the product, so the nav's pill steps back and
 * there is still only one heartwood button in view (as with the hero's own
 * button; see ../hero/signals.ts).
 */
export const addItShown = createSignal();
