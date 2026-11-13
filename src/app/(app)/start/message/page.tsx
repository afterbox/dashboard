import { StepScreen } from "@/components/onboarding/StepScreen";

// One address per step (src/lib/onboarding.ts), so a refresh or the back button lands on the same screen.
export default function MessageStep() {
  return <StepScreen step="message" />;
}
