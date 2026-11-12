import { BoxBack, BoxFront, BoxRings } from "./box/BoxSceneArt";
import { MaryArt } from "./say-it/art/MaryArt";
import { SayStage } from "./say-it/SayStage";

/**
 * 4. "Say it, for later": the messages. The emotional core of the page.
 *
 * A blush band. Dad has left three things, each addressed in his own hand: a
 * letter for Mary on her 18th birthday, a voice note for Jo for when the
 * house feels quiet, and a video for Mum. Mary grows up beside the words. The
 * letter writes itself, and the voice note and the video record, as each
 * comes up the screen; nothing needs pressing. Then three envelopes slide
 * into the box from section 3, and the lid begins to close: section 5
 * finishes closing it and ties the ribbon.
 *
 * Gift mode at its quietest. After the bounce of section 3, nothing here
 * bounces or glows: paper slides and settles (`ease-gift`), ink appears, the
 * waveform breathes. Biscuit isn't in it.
 *
 * The handwritten card at the end of section 3 lies across this band's top edge.
 */
export function SayIt() {
  return (
    // Clipped at the sides only: the box's rings run wider than a phone.
    <section data-section="say-it" aria-labelledby="say-it-line" className="overflow-x-clip bg-blush">
      <SayStage mary={<MaryArt />} rings={<BoxRings />} back={<BoxBack letters />} front={<BoxFront />} />
    </section>
  );
}
