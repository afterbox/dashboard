import { asked } from "@/components/sections/FamilySupport";
import { site } from "@/lib/site";
import { promises, trustLines } from "@/lib/trust-lines";

const at = (path: string) => new URL(path, site.url).toString();
const id = (name: string) => `${site.url}/#${name}`;

/**
 * What the landing page is, for search engines: schema.org JSON-LD
 * (node_modules/next/dist/docs/01-app/02-guides/json-ld.md).
 *
 * Everything here says what the page already says, in the same words. Search
 * engines distrust structured data that the reader can't see.
 */
export const landingPageData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": id("organisation"),
      name: site.name,
      url: site.url,
      logo: { "@type": "ImageObject", url: at("/apple-icon.png"), width: 180, height: 180 },
      image: at(site.image.url),
      description: site.description,
      areaServed: { "@type": "Country", name: "United Kingdom" },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "partnerships",
        email: site.partnersEmail,
        availableLanguage: "en-GB",
      },
    },
    {
      "@type": "WebSite",
      "@id": id("website"),
      url: site.url,
      name: site.name,
      description: site.description,
      inLanguage: "en-GB",
      publisher: { "@id": id("organisation") },
    },
    {
      "@type": "WebPage",
      "@id": id("webpage"),
      url: site.url,
      name: site.title,
      description: site.description,
      inLanguage: "en-GB",
      isPartOf: { "@id": id("website") },
      about: { "@id": id("organisation") },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: at(site.image.url),
        width: site.image.width,
        height: site.image.height,
        caption: site.image.alt,
      },
      // The places the navigation and the footer link to.
      hasPart: [
        { "@type": "WebPageElement", name: "How it works", url: at("/#how-it-works") },
        { "@type": "WebPageElement", name: "For families", url: at("/#families") },
        { "@type": "WebPageElement", name: "For organisations", url: at("/#organisations") },
      ],
      // The page's actions, in the words on their buttons.
      potentialAction: [
        { "@type": "Action", name: "Build their gift", target: at("/start") },
        { "@type": "Action", name: "Get help now", target: at("/family-support") },
        {
          "@type": "CommunicateAction",
          name: "Talk to us",
          target: `mailto:${site.partnersEmail}`,
          recipient: { "@id": id("organisation") },
        },
      ],
      mainEntity: [{ "@id": id("gift") }, { "@id": id("family-support") }],
    },
    {
      "@type": "Service",
      "@id": id("gift"),
      name: `${site.name} for the people you love most`,
      serviceType: "Life planning and messages for the people you love",
      description:
        "Add what they'll need to find, a little at a time: accounts, pensions, policies, where to find a crypto wallet, and your wishes. Leave letters, voice notes and videos for each person you name. It stays sealed while you're alive, grows with you, and opens for them when the time comes.",
      provider: { "@id": id("organisation") },
      areaServed: { "@type": "Country", name: "United Kingdom" },
      audience: { "@type": "Audience", audienceType: "Anyone planning ahead for the people they love most" },
      slogan: "Build it for them. Before they need it.",
      termsOfService: at("/terms"),
      // The promises, word for word.
      disambiguatingDescription: promises.join(" "),
      potentialAction: { "@type": "Action", name: "Build their gift", target: at("/start") },
    },
    {
      "@type": "Service",
      "@id": id("family-support"),
      name: `${site.name} family support`,
      serviceType: "Guided help after someone dies",
      description:
        "For families who have just lost someone. Even if the person you lost never used afterbox, we'll help you find what they had and settle it, one step at a time.",
      provider: { "@id": id("organisation") },
      areaServed: { "@type": "Country", name: "United Kingdom" },
      audience: { "@type": "Audience", audienceType: "Families who have just lost someone" },
      disambiguatingDescription: trustLines.advice,
      termsOfService: at("/terms"),
      potentialAction: { "@type": "Action", name: "Get help now", target: at("/family-support") },
    },
    {
      "@type": "FAQPage",
      "@id": id("families-questions"),
      url: at("/#families"),
      isPartOf: { "@id": id("webpage") },
      mainEntity: asked.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    },
  ],
};

/** JSON-LD ready for a script tag, with `<` escaped so nothing in it can close the tag early. */
export const asJsonLd = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");
