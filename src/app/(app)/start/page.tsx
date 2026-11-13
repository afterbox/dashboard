import { redirect } from "next/navigation";
import { firstStep, stepPath } from "@/lib/onboarding";

// The routing guard (src/proxy.ts) sends everyone to their own step before this is reached. This is the fallback.
export default function Start() {
  redirect(stepPath(firstStep));
}
