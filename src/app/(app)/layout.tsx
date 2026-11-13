import type { ReactNode } from "react";
import { StoreProvider } from "@/store/StoreProvider";

/**
 * The app itself: onboarding (/start), /signin and /home. The brackets keep
 * this folder out of the URLs. These pages share one store (src/store), so
 * what onboarding loads is already there when /home opens. The landing page
 * sits outside, and never loads any of it.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <StoreProvider>{children}</StoreProvider>;
}
