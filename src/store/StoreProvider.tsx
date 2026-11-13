"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { forgetWhoLeft, getQueryClient, onFoundSignedOut } from "./client";

/**
 * Gives the app's pages (onboarding, sign-in, /home) their store. It sits in
 * the layout they share (src/app/(app)/layout.tsx), so the landing page never
 * loads it.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  const client = getQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  // Signed out since /home was opened (here, or from another device): back to sign-in.
  useEffect(() => onFoundSignedOut(() => router.replace("/signin")), [router]);

  // Each time the screen changes, and on the way out to the landing page.
  useEffect(() => {
    forgetWhoLeft(client);
    return () => forgetWhoLeft(client);
  }, [client, pathname]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
