import { createSignal } from "@/lib/signal";

/**
 * What the hero tells the nav.
 *
 * `heroCta`: the hero's own "Build their gift" button is on screen, so the
 * nav's pill steps back and there is only ever one heartwood button in view.
 *
 * `zoomStarted`: the camera has left the street, so the art is about to pass
 * under the nav and the nav needs its solid bar to stay readable.
 */
export const heroCta = createSignal();
export const zoomStarted = createSignal();
