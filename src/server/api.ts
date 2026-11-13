import "server-only";
import { unstable_rethrow } from "next/navigation";
import type { z } from "zod";
import type { ApiErrorBody, OnboardingState } from "@/lib/schemas";
import { getDb } from "./db";
import type { Db } from "./db/types";
import { env } from "./env";
import { AppError } from "./errors";
import type { SessionUser } from "./services/onboarding";
import { checkSession, type SessionCheck } from "./session";
import { getRecordingStore, StorageError, type RecordingStore } from "./storage";
import { parseInput } from "./validate";
import { visitorHintFor } from "./visitor-hint";

/**
 * The shape every route handler under /api shares:
 *
 *   export const POST = route(async ({ request, user, db }) => { … });
 *
 * - Who is asking is worked out here, from the session cookie. `route` needs
 *   someone signed in (guest or not); `openRoute` doesn't. Reads may use the
 *   session's short-lived cookie copy; anything that changes something checks
 *   the database (./session.ts).
 * - Requests that change something must come from this site.
 * - Whatever is returned is sent as JSON, never cached.
 * - Errors become `{ error: { code, message, fields? } }`, in plain words.
 */

const noStore = { "Cache-Control": "no-store" };

export const json = (data: unknown, status = 200) => Response.json(data, { status, headers: noStore });

/**
 * Onboarding state, sent back with the routing guard's hint of where they now
 * are (./visitor-hint.ts), so the next page doesn't have to ask the database.
 */
export async function stateResponse(request: Request, state: OnboardingState, status = 200) {
  const response = json(state, status);
  const hint = await visitorHintFor(request, state);
  if (hint) response.headers.append("Set-Cookie", hint);
  return response;
}

const errorBody = (code: ApiErrorBody["error"]["code"], message: string, fields?: Record<string, string>) =>
  ({ error: { code, message, ...(fields ? { fields } : {}) } }) satisfies ApiErrorBody;

export function errorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    return json(errorBody(error.code, error.message, error.fields), error.status);
  }
  // Never the details: they can hold what someone typed. The kind of error is enough to find it.
  if (env().production) {
    const code = (error as { code?: unknown } | null)?.code;
    console.error(
      `[afterbox] A request failed (${error instanceof Error ? error.name : "unknown"}${typeof code === "string" ? ` ${code}` : ""}).`,
    );
  } else {
    console.error("[afterbox] A request failed.", error);
  }
  const message =
    error instanceof StorageError
      ? "We couldn't reach your recordings just now. Try again in a moment."
      : "Something went wrong on our side. Nothing was lost. Try again in a moment.";
  return json(errorBody("server_error", message), 500);
}

/** Requests that change something must come from our own pages. */
function checkOrigin(request: Request) {
  if (request.method === "GET" || request.method === "HEAD") return;
  const origin = request.headers.get("origin");
  // Browsers always send Origin on these; other clients have no cookie to ride on.
  if (!origin) return;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  let ours = false;
  try {
    ours = new URL(origin).host === host || new URL(origin).origin === new URL(env().BETTER_AUTH_URL).origin;
  } catch {
    ours = false;
  }
  if (!ours) throw new AppError("unauthenticated", "That request didn't come from afterbox.");
}

/** The JSON a request sent, checked against a schema. */
export async function body<S extends z.ZodType>(request: Request, schema: S): Promise<z.output<S>> {
  let data: unknown;
  try {
    data = await request.json();
  } catch {
    throw new AppError("invalid_input", "We couldn't read that. Try again?");
  }
  return parseInput(schema, data);
}

type Base<P> = {
  request: Request;
  params: P;
  db: Db;
  /** Recordings. Made on first use, so routes that don't touch them never reach for storage. */
  store: () => Promise<RecordingStore>;
};

type RouteContext<P> = { params: Promise<P> };

const reads = (request: Request) => request.method === "GET" || request.method === "HEAD";

function build<P, U>(
  resolveUser: (check: SessionCheck) => U,
  handler: (context: Base<P> & { user: U }) => Promise<unknown>,
) {
  return async (request: Request, context: RouteContext<P>): Promise<Response> => {
    try {
      checkOrigin(request);
      const check = await checkSession(request.headers, { fresh: !reads(request) });
      const user = resolveUser(check);
      const result = await handler({
        request,
        params: await context.params,
        db: await getDb(),
        store: getRecordingStore,
        user,
      });
      const response =
        result instanceof Response
          ? result
          : result === undefined
            ? new Response(null, { status: 204, headers: noStore })
            : json(result);
      for (const cookie of check.setCookies) response.headers.append("Set-Cookie", cookie);
      return response;
    } catch (error) {
      // Next.js stops a prerender by throwing (reading the request's headers at build time does it). That one is Next's to handle, not ours.
      unstable_rethrow(error);
      return errorResponse(error);
    }
  };
}

/** A route for someone with a session: a guest, or signed in. */
export function route<P = Record<string, never>>(
  handler: (context: Base<P> & { user: SessionUser }) => Promise<unknown>,
) {
  return build<P, SessionUser>(({ user }) => {
    if (!user) throw new AppError("unauthenticated", "Let's start again: your session has ended.");
    return user;
  }, handler);
}

/** A route that also answers people with no session yet. */
export function openRoute<P = Record<string, never>>(
  handler: (context: Base<P> & { user: SessionUser | null }) => Promise<unknown>,
) {
  return build<P, SessionUser | null>(({ user }) => user, handler);
}
