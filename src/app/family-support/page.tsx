import type { Metadata } from "next";
import { PlainPage } from "@/components/ui/PlainPage";
import { trustLines } from "@/lib/trust-lines";

export const metadata: Metadata = {
  title: "Family support · afterbox",
};

// PLACEHOLDER until family support exists. Still mode: care first, no cast, nothing sold.
export default function FamilySupport() {
  return (
    <PlainPage still title="We're so sorry. We'll take this one step at a time.">
      <p>
        Family support isn&apos;t open yet. When it is, this is where you&apos;ll start: with one small step,
        and someone to guide you through the rest.
      </p>
      <p className="text-body">{trustLines.advice}</p>
    </PlainPage>
  );
}
