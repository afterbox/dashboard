import { getAuth } from "@/server/auth";

/**
 * Better Auth's own endpoints, under /api/auth: guest sessions, sign-in codes
 * (send and check), Google when it is configured, sign out, and sign out
 * everywhere. See src/server/auth-config.ts.
 */
const handler = async (request: Request) => (await getAuth()).handler(request);

export { handler as GET, handler as POST };
