import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ComponentProps, ReactNode } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Footer } from "@/components/sections/Footer";
import { Nav } from "@/components/sections/Nav";
import { BackLink } from "@/components/ui/BackLink";
import "./legal.css";

type Props = {
  /** The file in docs/legal/. It is the only source of the page's words: edit it there. */
  file: "terms.md" | "privacy.md";
};

/** A heading's address on the page, from its words: "1. Who we are" becomes "1-who-we-are". */
const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

/** The words inside a rendered element, for headings with no formatting in them. */
const textOf = (children: ReactNode): string =>
  Array.isArray(children) ? children.map(textOf).join("") : typeof children === "string" ? children : "";

const components: Components = {
  h1: ({ children }) => (
    <h1 className="font-display text-display-m-mobile text-balance text-ink md:text-display-m">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 id={slug(textOf(children))} className="mt-14 scroll-mt-24 text-title text-pretty text-ink md:mt-16 md:scroll-mt-28">
      {children}
    </h2>
  ),
  h3: ({ children }) => <h3 className="mt-8 text-label text-ink">{children}</h3>,
  p: ({ node, children }) => {
    // The line under the title, "_Last updated: …_": set plainly, so it reads at a glance.
    const only = node?.children.length === 1 ? node.children[0] : undefined;
    const words = only?.type === "element" && only.tagName === "em" ? only.children.map((c) => ("value" in c ? c.value : "")).join("") : "";
    if (words.startsWith("Last updated")) {
      return <p className="mt-3 text-label text-ink-muted">{words}</p>;
    }
    return <p className="mt-4 text-body text-pretty text-ink first:mt-0">{children}</p>;
  },
  // The note before launch is the only quotation: a blush panel.
  blockquote: ({ children }) => (
    <aside className="mt-8 rounded-lg bg-blush px-5 py-4 md:px-6 md:py-5">{children}</aside>
  ),
  ul: ({ children }) => <ul className="mt-4 list-disc space-y-2 pl-5 text-body text-ink marker:text-ink-muted">{children}</ul>,
  ol: ({ children }) => <ol className="mt-4 list-decimal space-y-2 pl-5 text-body text-ink marker:text-ink-muted">{children}</ol>,
  li: ({ children }) => <li className="pl-1 text-pretty">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-heartwood underline decoration-heartwood/40 underline-offset-4 transition-colors duration-200 ease-state hover:decoration-heartwood"
    >
      {children}
    </a>
  ),
  // Tables scroll sideways on a phone, inside the column, rather than squeezing their words.
  table: ({ children }) => (
    <div className="mt-6 -mx-5 overflow-x-auto px-5 md:mx-0 md:px-0" tabIndex={0} role="region" aria-label="Table">
      <table className="w-full min-w-136 border-collapse text-left">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th scope="col" className="border-b border-line py-3 pr-6 align-bottom text-label text-ink last:pr-0">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-line py-3 pr-6 align-top text-body text-pretty text-ink last:pr-0">{children}</td>
  ),
};

function Prose(props: Omit<ComponentProps<typeof Markdown>, "components" | "remarkPlugins">) {
  return <Markdown remarkPlugins={[remarkGfm]} components={components} {...props} />;
}

/**
 * /terms and /privacy: a calm reading page. Gift mode, but quiet: linen, one
 * column, no illustrations, and nothing moves but a single fade as it opens.
 *
 * The words come from docs/legal/, read when the site is built, exactly as
 * written there, [bracketed] placeholders and all. The page splits the file
 * at its first section: the title, the date and the note before launch come
 * first, then "On this page", then the sections.
 */
export function LegalPage({ file }: Props) {
  const source = readFileSync(join(process.cwd(), "docs/legal", file), "utf8");
  const firstSection = source.search(/^## /m);
  const intro = source.slice(0, firstSection);
  const body = source.slice(firstSection);
  const sections = [...body.matchAll(/^## (.+)$/gm)].map(([, title]) => ({ title, id: slug(title) }));

  const contents = (
    <ol className="space-y-1">
      {sections.map(({ title, id }) => (
        <li key={id}>
          <a
            href={`#${id}`}
            className="inline-flex min-h-11 items-center text-small text-pretty text-ink-muted transition-colors duration-200 ease-state hover:text-heartwood xl:min-h-9"
          >
            {title}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <Nav overHero={false} />
      <main className="legal-fade bg-linen px-5 pt-20 pb-24 md:pt-26 md:pb-32">
        <div className="mx-auto grid max-w-160 grid-cols-[minmax(0,1fr)] xl:max-w-none xl:grid-cols-[minmax(0,1fr)_40rem_minmax(0,1fr)] xl:gap-x-16">
          <article className="min-w-0 xl:col-start-2">
            <BackLink className="mb-6 md:mb-8" />
            <Prose>{intro}</Prose>

            {/* Phones and tablets: folded away until asked for. */}
            <details className="group mt-10 border-y border-line xl:hidden">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between text-label text-ink [&::-webkit-details-marker]:hidden">
                On this page
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden
                  className="size-5 fill-none stroke-current transition-transform duration-200 ease-state group-open:rotate-180"
                >
                  <path d="M6 9l6 6 6-6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <nav aria-label="On this page" className="pb-4">
                {contents}
              </nav>
            </details>

            <Prose>{body}</Prose>
          </article>

          {/* Wide screens: in the left margin, staying in view while the page is read. */}
          <nav
            aria-label="On this page"
            className="hidden xl:col-start-1 xl:row-start-1 xl:block xl:justify-self-end xl:self-start xl:sticky xl:top-28 xl:max-h-[calc(100svh-9rem)] xl:w-60 xl:overflow-y-auto"
          >
            <p className="eyebrow text-ink-muted">On this page</p>
            <div className="mt-4 border-l border-line pl-4">{contents}</div>
          </nav>
        </div>
      </main>
      <Footer />
    </>
  );
}
