import type { Metadata } from "next";
import { PlainPage } from "@/components/ui/PlainPage";
import { trustLines } from "@/lib/trust-lines";

export const metadata: Metadata = {
  title: "Terms · afterbox",
};

// PLACEHOLDER until the terms are written.
export default function Terms() {
  return (
    <PlainPage title="Terms">
      <p>Our terms will be here before afterbox opens, in plain words.</p>
      <p className="text-ink">{trustLines.advice}</p>
    </PlainPage>
  );
}
