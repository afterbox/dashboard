import type { Metadata } from "next";
import { SignIn } from "@/components/app/SignIn";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Sign in",
    description: "Carry on with the gifts you've started for the people you love most.",
    path: "/signin",
  }),
  robots: { index: false, follow: true },
};

export default function SignInPage() {
  return <SignIn />;
}
