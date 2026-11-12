import { ease } from "@/lib/easing";
import type { Clock, Piece } from "./clock";

/**
 * How each living thing in the scene moves when nobody is scrolling.
 *
 * The rules: small and calm; transform and opacity only; every interval and
 * duration is picked at random within a range, each time, so nothing moves in
 * step with anything else; nothing is linear except the clouds.
 *
 * Each behaviour takes the parts it needs by name (see ../art/Part.tsx), so it
 * carries over to the commissioned art unchanged. Lengths are in artboard
 * units and angles in degrees. Times are in seconds.
 */

type Range = readonly [min: number, max: number];

const between = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T>(options: readonly T[]) => options[Math.floor(Math.random() * options.length)];
const ms = (seconds: number) => seconds * 1000;
const child = (piece: Piece, name: string) => piece.querySelector<Piece>(`[data-part="${name}"]`);

/** Each step eases in and out, unless it says otherwise. */
const steps = (...frames: Keyframe[]): Keyframe[] =>
  frames.map((frame) => ({ easing: ease.state, ...frame }));

/** Do something again and again, a random while apart. `soon` lets the first one come early. */
function every(clock: Clock, [min, max]: Range, act: () => void, soon = false) {
  const next = (first: boolean) =>
    clock.wait(ms(between(first && soon ? 0 : min, max)), () => {
      act();
      next(false);
    });
  next(true);
}

/** There and back for ever. Starts at a random point in the cycle. */
function sway(clock: Clock, piece: Piece, from: string, to: string, cycle: number) {
  const animation = clock.play(piece, [{ transform: from }, { transform: to }], {
    duration: ms(cycle) / 2,
    direction: "alternate",
    iterations: Infinity,
    easing: "ease-in-out",
  });
  animation.currentTime = Math.random() * ms(cycle);
  return animation;
}

/** A small jump: up and down along an arc, so it slows at the top like a real one. */
function arc(from: { x: number; y: number }, to: { x: number; y: number }, lift: number) {
  const frames: Keyframe[] = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t - lift * 4 * t * (1 - t);
    frames.push({ transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)` });
  }
  return frames;
}

/**
 * Clouds drift across, 60 to 120 seconds a crossing, each at its own speed.
 * A cloud goes all the way out past one edge of the screen before it comes
 * back in at the other, so the loop has no seam. This is the one linear motion.
 */
export function driftClouds(clock: Clock, clouds: Piece[], edges: { left: number; right: number }) {
  clouds.forEach((cloud, i) => {
    const box = cloud.getBBox();
    const from = edges.left - (box.x + box.width);
    const to = edges.right - box.x;
    // Each cloud takes its own slice of the range, so no two keep pace.
    const slice = 60 / clouds.length;
    const duration = ms(60 + slice * (i + Math.random()));
    const animation = clock.play(
      cloud,
      [{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }],
      { duration, iterations: Infinity, easing: "linear" },
    );
    // Begin where the cloud is drawn (or, if that's out of view, where it would have wrapped to).
    const drawnAt = -from / (to - from);
    animation.currentTime = duration * (((drawnAt % 1) + 1) % 1);
  });
}

/** A star, or dust in lamplight: fades in, stays a moment, fades out. Every 3 to 6 seconds. */
export function twinkle(clock: Clock, speck: Piece) {
  every(
    clock,
    [3, 6],
    () => {
      const glow = between(0.45, 0.9);
      clock.play(
        speck,
        steps(
          { opacity: 0 },
          { opacity: glow, offset: 0.4 },
          { opacity: glow, offset: 0.6 },
          { opacity: 0 },
        ),
        { duration: ms(between(2, 2.8)) },
      );
    },
    true,
  );
}

/** The tree sways from its foot, a degree or two each way. Its leaves follow, out of step. */
export function swayTree(clock: Clock, tree: Piece) {
  const lean = between(1, 2);
  const cycle = between(4, 6);
  sway(clock, tree, `rotate(${-lean}deg)`, `rotate(${lean}deg)`, cycle);

  tree.querySelectorAll<Piece>('[data-part="tree-leaf"]').forEach((leaf) => {
    const turn = between(2, 3.5);
    sway(clock, leaf, `rotate(${-turn}deg)`, `rotate(${turn}deg)`, cycle * between(0.8, 1.25));
  });
}

/**
 * The bird fidgets (a hop or two, a turn of the head) every few seconds, and
 * every 8 to 15 seconds flies to another perch on the roof.
 */
export function liveBird(clock: Clock, bird: Piece) {
  const head = child(bird, "bird-head");
  const size = (child(bird, "bird-body") ?? bird).getBBox().height;
  const perches = (bird.dataset.perches ?? "0,0").split(" ").map((pair) => {
    const [x, y] = pair.split(",").map(Number);
    return { x, y };
  });

  let perch = perches[0];
  let facing = 1;
  let flying = false;

  const turnHead = (to: number) => {
    if (!head || to === facing) return;
    clock.play(head, steps({ transform: `scaleX(${facing})` }, { transform: `scaleX(${to})` }), {
      duration: 260,
    });
    clock.hold(head, "transform", `scaleX(${to})`);
    facing = to;
  };

  const hop = () => {
    const hops = pick([1, 2]);
    clock.play(bird, arc(perch, perch, size * 0.4), { duration: 280, iterations: hops });
  };

  const fly = () => {
    const to = pick(perches.filter((other) => other !== perch));
    if (!to) return;
    flying = true;
    turnHead(to.x > perch.x ? 1 : -1);
    const duration = ms(between(0.9, 1.3));
    clock.play(bird, arc(perch, to, size * 2), { duration, easing: ease.state });
    clock.hold(bird, "transform", `translate(${to.x}px, ${to.y}px)`);
    perch = to;
    clock.wait(duration, () => (flying = false));
  };

  every(clock, [8, 15], fly);
  every(clock, [3.5, 6.5], () => {
    if (flying) return;
    pick([hop, hop, () => turnHead(-facing)])();
  });
}

/** Someone sitting: a rise of one part in a hundred, every 3 to 4 seconds. Nothing else. */
function breathe(clock: Clock, person: Piece) {
  sway(clock, person, "scale(1)", "scale(1.01)", between(3, 4));
}

// A breath in gathers and settles; a breath out lets go quickly and tails off.
const breathIn = "cubic-bezier(0.4, 0, 0.35, 1)";
const breathOut = "cubic-bezier(0.25, 0.45, 0.3, 1)";

/**
 * Someone sitting alone, with nothing else moving, so the breath has to read
 * as a breath (section 2). The chest (`person-body`) rises from where they sit
 * and fills out a touch; the head (`person-head`) rides up on the shoulders by
 * the same amount.
 *
 * Each breath is its own: about four and a half seconds, in for two fifths of
 * it, out for a little longer, then a short rest before the next. No two are
 * quite the same depth or length, and about one in seven is slower and
 * deeper. Nothing else: no blink, no gesture.
 */
export function breatheSeated(clock: Clock, person: Piece) {
  const body = child(person, "person-body");
  const head = child(person, "person-head");
  if (!body) return;
  const height = body.getBBox().height;

  const breath = () => {
    const deep = Math.random() < 0.14;
    const depth = (deep ? 1.5 : 1) * between(0.85, 1.15);
    const duration = ms(deep ? between(5.6, 6.4) : between(4.1, 4.9));
    const rise = 0.042 * depth;
    const full = 0.4;
    const empty = 0.88;

    clock.play(
      body,
      [
        { transform: "scale(1, 1)", easing: breathIn },
        { transform: `scale(${1 + rise * 0.3}, ${1 + rise})`, offset: full, easing: breathOut },
        { transform: "scale(1, 1)", offset: empty },
        { transform: "scale(1, 1)" },
      ],
      { duration },
    );
    if (head) {
      const lift = `translateY(${(-height * rise).toFixed(2)}px)`;
      clock.play(
        head,
        [
          { transform: "translateY(0px)", easing: breathIn },
          { transform: lift, offset: full, easing: breathOut },
          { transform: "translateY(0px)", offset: empty },
          { transform: "translateY(0px)" },
        ],
        { duration },
      );
    }
    clock.wait(duration, breath);
  };

  // Start part-way to the first breath, so it never begins the instant the scene appears.
  clock.wait(ms(between(0.2, 1.2)), breath);
}

/**
 * Someone at the table. They breathe (a rise of one part in a hundred, every
 * 3 to 4 seconds), blink every 3 to 7 seconds, and every 6 to 12 seconds make
 * one small gesture: a tilt of the head, or lifting their cup if they have one.
 */
export function livePerson(clock: Clock, person: Piece, hand: Piece | null) {
  const head = child(person, "person-head");
  const eyes = child(person, "person-eyes");

  breathe(clock, person);

  if (eyes) {
    const blink = () =>
      clock.play(
        eyes,
        steps({ transform: "scaleY(1)" }, { transform: "scaleY(0.1)" }, { transform: "scaleY(1)" }),
        { duration: 180 },
      );
    every(
      clock,
      [3, 7],
      () => {
        blink();
        // Now and then, twice.
        if (Math.random() < 0.2) clock.wait(280, blink);
      },
      true,
    );
  }

  const gestures: (() => void)[] = [];

  if (head) {
    gestures.push(() => {
      const tilt = pick([-1, 1]) * between(3, 6);
      clock.play(
        head,
        steps(
          { transform: "rotate(0deg)", easing: ease.gift },
          { transform: `rotate(${tilt}deg)`, offset: 0.25 },
          { transform: `rotate(${tilt}deg)`, offset: 0.7 },
          { transform: "rotate(0deg)" },
        ),
        { duration: ms(between(2.2, 3.2)) },
      );
    });
  }

  if (hand) {
    gestures.push(() => {
      const rise = hand.getBBox().height * between(0.6, 0.8);
      const lifted = `translate(0px, ${(-rise).toFixed(1)}px) rotate(-10deg)`;
      clock.play(
        hand,
        steps(
          { transform: "translate(0px, 0px) rotate(0deg)", easing: ease.gift },
          { transform: lifted, offset: 0.3 },
          { transform: lifted, offset: 0.65 },
          { transform: "translate(0px, 0px) rotate(0deg)" },
        ),
        { duration: ms(between(2.4, 3.2)) },
      );
    });
  }

  if (gestures.length > 0) every(clock, [6, 12], () => pick(gestures)());
}

/** Biscuit, lying still: his side rises and falls, and his head rides the same breath. Nothing else. */
export function breatheBiscuit(clock: Clock, biscuit: Piece) {
  const body = child(biscuit, "biscuit-body");
  const head = child(biscuit, "biscuit-head");
  if (!body) return;

  const cycle = between(3.5, 4.5);
  const breath = sway(clock, body, "scaleY(1)", "scaleY(1.05)", cycle);
  if (head) {
    const nod = sway(clock, head, "translateY(0px)", "translateY(-1.5px)", cycle);
    nod.currentTime = breath.currentTime;
  }
}

/** Biscuit, asleep: his side rises and falls, and now and then an ear twitches or his tail flicks. */
export function liveBiscuit(clock: Clock, biscuit: Piece) {
  const ear = child(biscuit, "biscuit-ear");
  const tail = child(biscuit, "biscuit-tail");

  breatheBiscuit(clock, biscuit);

  if (ear) {
    every(clock, [7, 14], () => {
      clock.play(
        ear,
        steps(
          { transform: "rotate(0deg)" },
          { transform: "rotate(-14deg)" },
          { transform: "rotate(0deg)" },
          { transform: "rotate(-8deg)" },
          { transform: "rotate(0deg)" },
        ),
        { duration: 460 },
      );
    });
  }

  if (tail) {
    every(clock, [9, 16], () => {
      clock.play(
        tail,
        steps(
          { transform: "rotate(0deg)" },
          { transform: "rotate(16deg)" },
          { transform: "rotate(-5deg)" },
          { transform: "rotate(0deg)" },
        ),
        { duration: 700 },
      );
    });
  }
}

/** Lamplight: a very soft, uneven flicker between 0.92 and 1. Never a pulse. */
export function flicker(clock: Clock, light: Piece) {
  let level = 1;
  const waver = () => {
    const next = between(0.92, 1);
    const duration = ms(between(0.5, 1.4));
    clock.play(light, [{ opacity: level }, { opacity: next }], { duration, easing: "ease-in-out" });
    clock.hold(light, "opacity", String(next));
    level = next;
    clock.wait(duration, waver);
  };
  waver();
}
