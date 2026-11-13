import type { Metadata } from "next";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Build their gift",
  description:
    "Start with someone you love: say something only you could say, and begin gathering what they'll need to find. It only takes a few minutes to begin.",
  path: "/start",
});

/**
 * Onboarding (docs/onboarding-story.md). The pages are the same for everyone
 * and hold nothing personal: who is here, and what they have made, is loaded
 * in the browser from /api/session. That keeps every step instant, and lets
 * the gift box travel in from the landing page.
 */
export default function StartLayout({ children }: LayoutProps<"/start">) {
  return (
    <OnboardingProvider>
      <OnboardingShell>{children}</OnboardingShell>
    </OnboardingProvider>
  );
}
