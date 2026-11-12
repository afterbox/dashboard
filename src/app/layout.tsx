import type { Metadata, Viewport } from "next";
import { Caveat, Figtree, Fraunces } from "next/font/google";
import { StartAtTop } from "@/components/StartAtTop";
import { RememberPath } from "@/components/ui/BackLink";
import { pageMetadata, site } from "@/lib/site";
import "./globals.css";

// Display: Fraunces (variable), with the SOFT and optical-size axes.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
  display: "swap",
});

// Body and UI.
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  display: "swap",
});

// Handwritten voice — only for the user's own words.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500"],
  display: "swap",
});

// Every page starts from this and replaces only what it says about itself (src/lib/site.ts).
export const metadata: Metadata = {
  ...pageMetadata({ description: site.description, path: "/" }),
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s · ${site.name}` },
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  category: "Personal finance and family planning",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  // Stops phones turning numbers in the copy (£38.50, 0:42) into phone links.
  formatDetection: { telephone: false, address: false, email: false },
  appleWebApp: { title: site.name },
};

// Status bar / browser chrome matches the page ground in both themes.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf6ef" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1416" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-GB"
      className={`${fraunces.variable} ${figtree.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-linen text-ink">
        <StartAtTop />
        <RememberPath />
        {children}
      </body>
    </html>
  );
}
