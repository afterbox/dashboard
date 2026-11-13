import type { Metadata } from "next";
import { Home } from "@/components/home/Home";

// Theirs alone: nothing here for a search engine. The routing guard (src/proxy.ts) lets in only someone who has finished onboarding.
export const metadata: Metadata = {
  title: "Your gifts",
  robots: { index: false, follow: false },
};

export default function HomePage() {
  return <Home />;
}
