import { testCodeFor } from "@/server/email";
import { env } from "@/server/env";

/**
 * Test-only: the latest sign-in code sent to an address, so end-to-end tests
 * can sign in without an inbox. It only exists when E2E_TEST_MODE=1, which the
 * app refuses to start with in production; otherwise this is a plain 404.
 */
export async function GET(request: Request) {
  if (!env().testMode) return new Response(null, { status: 404 });
  const email = new URL(request.url).searchParams.get("email") ?? "";
  const code = testCodeFor(email);
  return Response.json({ code }, { status: code ? 200 : 404, headers: { "Cache-Control": "no-store" } });
}
