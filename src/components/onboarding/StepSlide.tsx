"use client";

import { ViewTransition, type ReactNode } from "react";

/** Forward: in from the right. Back: in from the left. Anything else (the browser's own back button, a refresh): no slide. */
const slide = { "step-forward": "step-forward", "step-back": "step-back", default: "none" } as const;

/** A step's content slides across as the steps change (globals.css, "View transitions"). */
export function StepSlide({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={slide} exit={slide} default="none">
      {children}
    </ViewTransition>
  );
}
