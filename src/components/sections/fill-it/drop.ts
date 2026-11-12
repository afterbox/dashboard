import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { ease } from "@/lib/easing";
import type { Step } from "./use-beats";

/**
 * The drop: this section's motion signature. A card lifts from where it lies,
 * hangs for a moment, and falls into the box. The box squashes as it catches
 * it, a ring grows, the box glows once, and Biscuit wags.
 *
 * The card that flies is a copy of the one in the page, kept in the box scene
 * between the back of the box and its front, so it drops in behind the front.
 * Where it starts and where the box is are read afresh on every frame, so the
 * flight holds together while the page is still scrolling.
 *
 * Reduced motion: nothing flies. The cards stay in the page to be read, and
 * the box is already full (see ../box/box-scene.css).
 */

// Milliseconds.
const flight = 760;
/** Between two cards of the same beat. */
const apart = 260;

// Shares of the flight, 0 to 1.
/** It rises for this long, */
const rising = 0.36;
/** and is this far along its path when it hangs. */
const hangsAt = 0.3;
/** The box catches it here, a touch before it comes to rest inside. */
const caughtAt = 0.84;

type Flight = {
  /** The card in the page: where the flight starts. */
  card: HTMLElement;
  /** Its copy in the box scene: what moves. */
  flyer: HTMLElement;
  /** What the copy is placed against. */
  layer: HTMLElement;
  /** The front of the box. */
  mouth: HTMLElement;
  /** How far it turns on the way, in degrees. */
  tilt: number;
  /** It waits this long in place before it lifts. */
  delay: number;
  /** `seen`: it flew. False when the card was off-screen, so it is simply in the box. */
  onCatch: (seen: boolean) => void;
};

/** Sets one card flying. Returns how to call it off. */
function fly({ card, flyer, layer, mouth, tilt, delay, onCatch }: Flight) {
  const started = performance.now() + delay;
  let frame = 0;
  let caught = false;

  // A card nobody can see (the page was jumped past it) doesn't fly in from off-screen.
  const { top, bottom } = card.getBoundingClientRect();
  if (bottom < 0 || top > window.innerHeight) {
    frame = requestAnimationFrame(() => onCatch(false));
    return () => cancelAnimationFrame(frame);
  }

  // The copy wraps its words exactly as the card does.
  flyer.style.width = `${card.offsetWidth}px`;
  flyer.style.opacity = "1";

  const draw = () => {
    const t = Math.min(1, Math.max(0, (performance.now() - started) / flight));
    // Up, slowing to a stop; then down, gathering speed.
    const u =
      t < rising
        ? hangsAt * (1 - (1 - t / rising) ** 3)
        : hangsAt + (1 - hangsAt) * ((t - rising) / (1 - rising)) ** 2;

    const from = card.getBoundingClientRect();
    const base = layer.getBoundingClientRect();
    const box = mouth.getBoundingClientRect();
    const width = flyer.offsetWidth;
    const height = flyer.offsetHeight;

    const start = { x: from.left + from.width / 2, y: from.top + from.height / 2 };
    // It comes to rest inside, small enough to be hidden by the front of the box.
    const end = { x: box.left + box.width / 2, y: box.top + box.height * 0.56 };
    const small = Math.min((box.width * 0.62) / width, (box.height * 0.78) / height);
    // One curve: up over the box, and straight down into it.
    const over = {
      x: end.x + (start.x - end.x) * 0.3,
      y: Math.min(start.y, box.top) - box.height * 1.1,
    };
    const a = (1 - u) * (1 - u);
    const b = 2 * (1 - u) * u;
    const c = u * u;
    const x = a * start.x + b * over.x + c * end.x - base.left - width / 2;
    const y = a * start.y + b * over.y + c * end.y - base.top - height / 2;
    const scale = 1 + (small - 1) * u ** 0.8;

    flyer.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${(tilt * u).toFixed(1)}deg) scale(${scale.toFixed(3)})`;

    if (!caught && t >= caughtAt) {
      caught = true;
      onCatch(true);
    }
    if (t < 1) frame = requestAnimationFrame(draw);
    else flyer.style.opacity = "0";
  };
  draw();

  return () => {
    cancelAnimationFrame(frame);
    flyer.style.opacity = "0";
  };
}

/** The box catches a card. `last`: it was the beat's last, so the beat has landed. */
function celebrate(scene: HTMLElement, last: boolean) {
  // Both halves of the box squash together, from its foot: 1 → 0.96 → 1 over 300ms.
  scene.querySelectorAll<SVGGElement>('[data-part="box"]').forEach((half) => {
    half.animate(
      [
        { transform: "scale(1, 1)", easing: ease.state },
        { transform: "scale(1.025, 0.96)", offset: 0.34, easing: ease.play },
        { transform: "scale(1, 1)" },
      ],
      { duration: 300 },
    );
  });
  if (!last) return;

  // One glow, briefly.
  scene.querySelector<HTMLElement>('[data-part="glow"]')?.animate(
    [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.45 }, { opacity: 0 }],
    { duration: 900, easing: ease.state },
  );

  // Biscuit wags.
  scene.querySelector<SVGGElement>('[data-part="biscuit-tail"]')?.animate(
    [0, 26, -12, 22, -8, 14, 0].map((turn) => ({ transform: `rotate(${turn}deg)`, easing: ease.state })),
    { duration: 1100 },
  );
}

/**
 * Drops each beat's cards into the box when the beat reaches its last step,
 * and takes them out again if the page is scrolled back above it.
 *
 * Returns how many cards of each beat are in the box.
 */
export function useDrops(
  /** The section's layout: holds the beats, each marked `data-beat`, and their cards (`data-card`). */
  layout: RefObject<HTMLElement | null>,
  /** The box scene: holds the flying copies (`data-flyer`), inside `data-flyers`. */
  stage: RefObject<HTMLElement | null>,
  steps: readonly Step[],
  reduced: boolean,
) {
  const [landed, setLanded] = useState<readonly number[]>(() => steps.map(() => 0));
  const before = useRef(steps);
  const flights = useRef(new Map<number, (() => void)[]>());

  // Before the paint, so the copy is in place in the same frame the card is hidden.
  useLayoutEffect(() => {
    const root = layout.current;
    const scene = stage.current;
    const was = before.current;
    before.current = steps;
    if (!root || !scene || reduced) return;

    const layer = scene.querySelector<HTMLElement>("[data-flyers]");
    const mouth = scene.querySelector<HTMLElement>('[data-part="glow"]');
    if (!layer || !mouth) return;

    const callOff = (beat: number) => {
      flights.current.get(beat)?.forEach((stop) => stop());
      flights.current.delete(beat);
    };

    steps.forEach((step, beat) => {
      if (step === 3 && was[beat] !== 3) {
        const cards = [...root.querySelectorAll<HTMLElement>(`[data-beat="${beat}"] [data-card]`)];
        const flyers = [...scene.querySelectorAll<HTMLElement>(`[data-flyer="${beat}"]`)];
        callOff(beat);
        flights.current.set(
          beat,
          cards.map((card, i) =>
            fly({
              card,
              flyer: flyers[i],
              layer,
              mouth,
              tilt: i % 2 === 0 ? 7 : -6,
              delay: i * apart,
              onCatch: (seen) => {
                setLanded((counts) => counts.map((count, b) => (b === beat ? Math.max(count, i + 1) : count)));
                if (seen) celebrate(scene, i === cards.length - 1);
              },
            }),
          ),
        );
      } else if (step !== 3 && was[beat] === 3) {
        callOff(beat);
        setLanded((counts) => (counts[beat] === 0 ? counts : counts.map((count, b) => (b === beat ? 0 : count))));
      }
    });
  }, [layout, stage, steps, reduced]);

  useEffect(() => {
    const running = flights.current;
    return () => running.forEach((stops) => stops.forEach((stop) => stop()));
  }, []);

  return landed;
}
