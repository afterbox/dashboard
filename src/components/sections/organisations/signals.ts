import { createSignal } from "@/lib/signal";

/**
 * What section 9 tells the nav.
 *
 * `talkShown`: "Talk to us" is on screen. For the people this section is
 * written for, that is the action, so the nav's pill steps back and there is
 * still only one heartwood button in view (see ../hero/signals.ts).
 */
export const talkShown = createSignal();
