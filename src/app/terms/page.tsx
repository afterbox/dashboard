import type { Metadata } from "next";
import { PlainPage } from "@/components/ui/PlainPage";
import { pageMetadata } from "@/lib/site";
import { trustLines } from "@/lib/trust-lines";

export const metadata: Metadata = pageMetadata({
  title: "Terms",
  description: "The terms for using afterbox, in plain words. We guide you. We don't give legal or financial advice.",
  path: "/terms",
});

// PLACEHOLDER until the terms are written.
export default function Terms() {
  return (
    <PlainPage title="Terms">
      <p>Our terms will be here before afterbox opens, in plain words.</p>
      <p className="text-ink">{trustLines.advice}</p>
    </PlainPage>
  );
}
