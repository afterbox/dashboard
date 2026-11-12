import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Terms of service — afterbox",
  whole: true,
  description:
    "The terms for using afterbox, in plain words: what we do, what we ask of you, and what we promise in return.",
  path: "/terms",
});

// The words are docs/legal/terms.md. Edit them there.
export default function Terms() {
  return <LegalPage file="terms.md" />;
}
