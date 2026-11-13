import { openRoute } from "@/server/api";
import { getVisitor } from "@/server/services/onboarding";

/**
 * What the routing guard (src/proxy.ts) needs to know about whoever is asking:
 * no session, a guest, or signed in; the step they are on; whether onboarding
 * is finished. Nothing else about them.
 */
export const GET = openRoute(async ({ user, db }) => getVisitor(db, user));
