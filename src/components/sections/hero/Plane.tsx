import type { ReactNode } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
import { fadeAt, zoomAt, type PlaneSpec } from "./timeline";

type Props = {
  /** Which layer this is. The ambient motion uses it to rest a layer once the camera has passed it. */
  name: string;
  progress: MotionValue<number>;
  spec: PlaneSpec;
  /**
   * A flat colour that carries on past the edges of the art, for a plane the
   * camera sees the edge of before it fills the screen (the kitchen wall).
   */
  bleed?: string;
  /** Part of the final frame, so it stays, still, when motion is reduced. */
  inFinalFrame?: boolean;
  children: ReactNode;
};

// With reduced motion, CSS holds the final frame from the first paint, before any script runs.
const finalFrame =
  "motion-reduce:visible! motion-reduce:transform-none! motion-reduce:opacity-100!";

/**
 * One layer of the zoom. Every plane fills the same artboard and scales about
 * the same point, so depth comes only from each one growing at its own rate.
 * Hidden outright once it has faded, so it costs nothing to paint.
 */
export function Plane({ name, progress, spec, bleed, inFinalFrame = false, children }: Props) {
  const scale = useTransform(progress, (p) => zoomAt(spec.scale, p));
  const opacity = useTransform(progress, (p) => fadeAt(spec.opacity, p));
  const visibility = useTransform(opacity, (o) => (o > 0 ? "visible" : "hidden"));

  return (
    <motion.div
      data-plane={name}
      style={{ scale, opacity, visibility }}
      className={`absolute inset-0 landscape:origin-[68%_50%] portrait:origin-[50%_36%] ${
        inFinalFrame ? finalFrame : "motion-reduce:hidden"
      }`}
    >
      {bleed && <div className={`absolute -inset-[30%] ${bleed}`} />}
      {children}
    </motion.div>
  );
}
