import type { Metadata } from "next";
import { PlainPage } from "@/components/ui/PlainPage";
import { pageMetadata } from "@/lib/site";
import { promises } from "@/lib/trust-lines";

export const metadata: Metadata = pageMetadata({
  title: "Privacy",
  description:
    "How afterbox looks after what you keep for the people you love. Not even afterbox can open your vault. We never sell your data.",
  path: "/privacy",
});

// PLACEHOLDER until the privacy notice is written. The promises are the trust lines, word for word.
export default function Privacy() {
  return (
    <PlainPage title="Privacy">
      <p>Our full privacy notice will be here before afterbox opens. Until then, the promises it will keep:</p>
      <ul className="space-y-2 text-ink">
        {promises.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </PlainPage>
  );
}
