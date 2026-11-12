import Link from "next/link";

// Until a mark exists, the logo is the name set in Fraunces. Always lowercase.
export function Wordmark() {
  return (
    <Link
      href="/"
      aria-label="afterbox, home"
      className="font-display inline-flex min-h-11 items-center text-display-s-mobile text-ink"
    >
      afterbox
    </Link>
  );
}
