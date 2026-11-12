import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Privacy policy — afterbox",
  whole: true,
  description:
    "How afterbox looks after your information and the people you name. We never sell your data, and not even afterbox can open your vault.",
  path: "/privacy",
});

// The words are docs/legal/privacy.md. Edit them there.
export default function Privacy() {
  return <LegalPage file="privacy.md" />;
}
