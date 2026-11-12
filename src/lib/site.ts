import type { Metadata } from "next";

/**
 * What the site says about itself to search engines and to link previews
 * (WhatsApp, iMessage, LinkedIn, Slack, X, Facebook).
 *
 * Next.js replaces a parent's `openGraph` and `twitter` rather than merging
 * them, so every page builds its metadata through `pageMetadata` below: that
 * way each keeps the social image and only changes its own words.
 */
export const site = {
  name: "afterbox",
  /** Set NEXT_PUBLIC_SITE_URL on preview deployments; production is the UK domain. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://afterbox.co.uk",
  locale: "en_GB",
  title: "afterbox — build their gift, so they won't have to guess",
  description:
    "Everything the people you love most will need to find, and everything you want them to hear. Gathered as your life grows, and given to them when the time comes.",
  /** public/og-image.png, 1200 × 630. */
  image: {
    url: "/og-image.png",
    width: 1200,
    height: 630,
    alt: "afterbox: Build it for them. Before they need it. A gift box with a note that reads: Everything you'll need is in here. Love, Dad x",
    type: "image/png",
  },
  partnersEmail: "partners@afterbox.co.uk",
} as const;

type PageMetadata = {
  /** The page's own title. The layout adds " · afterbox". */
  title?: string;
  description: string;
  /** The page's path, from the root: its canonical address. */
  path: string;
};

export function pageMetadata({ title, description, path }: PageMetadata): Metadata {
  const social = title ? `${title} · ${site.name}` : site.title;
  return {
    ...(title && { title }),
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: site.locale,
      url: path,
      title: social,
      description,
      images: [site.image],
    },
    twitter: {
      card: "summary_large_image",
      title: social,
      description,
      images: [{ url: site.image.url, alt: site.image.alt }],
    },
  };
}
