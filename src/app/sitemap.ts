import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/** Every page, most important first. The landing page's sections are described in its structured data instead (src/lib/structured-data.ts). */
const pages: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/start", priority: 0.9, changeFrequency: "monthly" },
  { path: "/family-support", priority: 0.9, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // No last-modified date: a date that changes on every visit is worse than none.
  return pages.map(({ path, priority, changeFrequency }) => ({
    url: new URL(path, site.url).toString(),
    changeFrequency,
    priority,
  }));
}
