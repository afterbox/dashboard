type Timer = { run: () => void; remaining: number; armedAt: number; id: number };

/** A part of the art that the ambient motion can move. */
export type Piece = SVGGraphicsElement;

/**
 * A clock that can be stopped.
 *
 * Every timer and animation on one layer of the scene hangs off one of these,
 * so the whole layer can rest (off-screen, in a hidden tab, or once the camera
 * has passed it) and pick up exactly where it left off. A resting clock costs
 * nothing: no timers are armed and no animation is running.
 */
export class Clock {
  private running = false;
  private timers = new Set<Timer>();
  private animations = new Set<Animation>();
  private held = new Set<Piece>();

  /** Call `run` after `ms` of running time. Time spent resting doesn't count. */
  wait(ms: number, run: () => void) {
    const timer: Timer = { run, remaining: ms, armedAt: 0, id: 0 };
    this.timers.add(timer);
    if (this.running) this.arm(timer);
  }

  /** Animate a piece. The animation rests whenever the clock does. */
  play(piece: Piece, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
    const animation = piece.animate(keyframes, options);
    this.animations.add(animation);
    if (!this.running) animation.pause();
    // Forget one-off animations once they finish. (Cancelling rejects; that's fine.)
    animation.finished.then(
      () => this.animations.delete(animation),
      () => {},
    );
    return animation;
  }

  /** Leave a piece where an animation is about to put it (the bird on a new perch). */
  hold(piece: Piece, property: "transform" | "opacity", value: string) {
    piece.style.setProperty(property, value);
    this.held.add(piece);
  }

  resume() {
    if (this.running) return;
    this.running = true;
    this.timers.forEach((timer) => this.arm(timer));
    this.animations.forEach((animation) => {
      if (animation.playState === "paused") animation.play();
    });
  }

  pause() {
    if (!this.running) return;
    this.running = false;
    const now = performance.now();
    this.timers.forEach((timer) => {
      window.clearTimeout(timer.id);
      timer.remaining = Math.max(0, timer.remaining - (now - timer.armedAt));
    });
    this.animations.forEach((animation) => animation.pause());
  }

  /** Stop for good and put every piece back as it was drawn. */
  stop() {
    this.pause();
    this.timers.clear();
    this.animations.forEach((animation) => animation.cancel());
    this.animations.clear();
    this.held.forEach((piece) => {
      piece.style.removeProperty("transform");
      piece.style.removeProperty("opacity");
    });
    this.held.clear();
  }

  private arm(timer: Timer) {
    timer.armedAt = performance.now();
    timer.id = window.setTimeout(() => {
      this.timers.delete(timer);
      timer.run();
    }, timer.remaining);
  }
}
