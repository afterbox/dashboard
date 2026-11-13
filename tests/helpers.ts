import type { SQL } from "drizzle-orm";
import { createAuth, type AuthDeps } from "@/server/auth-config";
import { createPgliteDb } from "@/server/db/pglite";
import { user } from "@/server/db/schema";
import type { Db } from "@/server/db/types";
import type { CodeEmail, SendCode } from "@/server/email";
import type { SessionUser } from "@/server/services/onboarding";
import type { RecordingStore } from "@/server/storage";

/**
 * What the tests share: a fresh in-process Postgres with the real migrations,
 * and stand-ins for Supabase Storage and Resend. Nothing here reaches the
 * network or reads .env.local.
 */

export const origin = "http://localhost:3000";

/** A fresh database, migrated. One per test file. */
export async function testDb(): Promise<{ db: Db; close: () => Promise<void> }> {
  return createPgliteDb();
}

/** Run plain SQL and get the rows back, whichever driver is underneath. */
export async function query<T>(db: Db, statement: SQL): Promise<T[]> {
  const result = (await db.execute(statement)) as unknown as { rows?: T[] } | T[];
  return Array.isArray(result) ? result : (result.rows ?? []);
}

let counter = 0;

/** A user row, made directly. `guest` makes it anonymous, as the first screen does. */
export async function addUser(db: Db, options: { guest?: boolean; email?: string } = {}): Promise<SessionUser> {
  counter += 1;
  const id = `user_${counter}_${crypto.randomUUID().slice(0, 8)}`;
  const email = options.email ?? (options.guest ? `temp-${id}@guest.afterbox.invalid` : `${id}@example.com`);
  await db.insert(user).values({ id, name: "", email, emailVerified: !options.guest, isAnonymous: Boolean(options.guest) });
  return { id, isAnonymous: Boolean(options.guest), email };
}

// ── Supabase Storage, stood in for ──────────────────────────────────────────

export type FakeStore = RecordingStore & {
  files: Map<string, { sizeBytes: number; contentType: string | null }>;
  /** As if the browser had finished uploading to a signed URL. */
  put(path: string, file?: { sizeBytes?: number; contentType?: string | null }): void;
  /** Every playback URL handed out, with how long it was for. */
  playbackUrls: { path: string; expiresInSeconds: number }[];
};

export function fakeStore(): FakeStore {
  const files: FakeStore["files"] = new Map();
  const playbackUrls: FakeStore["playbackUrls"] = [];
  return {
    files,
    playbackUrls,
    put(path, file = {}) {
      files.set(path, { sizeBytes: file.sizeBytes ?? 48_000, contentType: file.contentType ?? "audio/webm" });
    },
    async createUploadUrl(path) {
      return `https://storage.test/upload/${path}?token=${crypto.randomUUID()}`;
    },
    async createPlaybackUrl(path, expiresInSeconds) {
      playbackUrls.push({ path, expiresInSeconds });
      return `https://storage.test/play/${path}?token=${crypto.randomUUID()}`;
    },
    async stat(path) {
      return files.get(path) ?? null;
    },
    async remove(paths) {
      for (const path of paths) files.delete(path);
    },
  };
}

// ── Resend, stood in for ────────────────────────────────────────────────────

export function fakeInbox() {
  const sent: CodeEmail[] = [];
  const sendCode: SendCode = async (email) => {
    sent.push(email);
  };
  return {
    sent,
    sendCode,
    /** The latest code sent to an address. */
    codeFor(email: string) {
      const latest = sent.findLast((message) => message.to === email.toLowerCase());
      if (!latest) throw new Error(`No code was sent to ${email}.`);
      return latest.code;
    },
  };
}

// ── Sign-in, as a browser sees it ───────────────────────────────────────────

export function testAuth(db: Db, overrides: Partial<AuthDeps> = {}) {
  const inbox = fakeInbox();
  const auth = createAuth({
    db,
    baseURL: origin,
    secret: "test-only-secret-test-only-secret-0123456789",
    production: false,
    sendCode: inbox.sendCode,
    limits: { perAddress: false },
    ...overrides,
  });
  return { auth, inbox };
}

type Handler = (request: Request) => Promise<Response>;

/**
 * A browser: keeps the cookies it is given and sends them back. Talks to
 * Better Auth's handler exactly as the app's /api/auth route does.
 */
export function browser(handler: Handler, options: { ip?: string } = {}) {
  const jar = new Map<string, string>();
  /** The Set-Cookie headers seen, as sent, for checking their flags. */
  const setCookies: string[] = [];

  const headers = (extra: Record<string, string> = {}) => {
    const all: Record<string, string> = { origin, ...extra };
    if (jar.size > 0) all.cookie = [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
    if (options.ip) all["x-forwarded-for"] = options.ip;
    return all;
  };

  const keep = (response: Response) => {
    for (const cookie of response.headers.getSetCookie()) {
      setCookies.push(cookie);
      const [pair, ...attributes] = cookie.split(";");
      const name = pair.slice(0, pair.indexOf("=")).trim();
      const value = pair.slice(pair.indexOf("=") + 1).trim();
      const gone = value === "" || attributes.some((a) => /^\s*max-age=0\s*$/i.test(a));
      if (gone) jar.delete(name);
      else jar.set(name, value);
    }
    return response;
  };

  const send = async (path: string, init: { method: string; body?: unknown }) => {
    const response = keep(
      await handler(
        new Request(`${origin}${path}`, {
          method: init.method,
          headers: headers(init.body === undefined ? {} : { "content-type": "application/json" }),
          body: init.body === undefined ? undefined : JSON.stringify(init.body),
        }),
      ),
    );
    const text = await response.text();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test responses are read loosely
    const data: any = text ? JSON.parse(text) : null;
    return { status: response.status, data, response };
  };

  return {
    jar,
    setCookies,
    headers: () => new Headers(headers()),
    get: (path: string) => send(path, { method: "GET" }),
    post: (path: string, body: unknown = {}) => send(path, { method: "POST", body }),

    /** Begin as a guest. Returns the guest's user id. */
    async beginAsGuest(): Promise<string> {
      const { status, data } = await send("/api/auth/sign-in/anonymous", { method: "POST", body: {} });
      if (status !== 200) throw new Error(`Guest sign-in failed (${status}).`);
      return data.user.id;
    },
    askForCode: (email: string) =>
      send("/api/auth/email-otp/send-verification-otp", { method: "POST", body: { email, type: "sign-in" } }),
    signInWithCode: (email: string, otp: string) =>
      send("/api/auth/sign-in/email-otp", { method: "POST", body: { email, otp } }),
    /** Who the server says this browser is, or null. */
    /** Who the session says this is. `fresh` asks the database, not the session's cookie copy. */
    async whoAmI({ fresh = false } = {}): Promise<{ id: string; email: string; isAnonymous: boolean } | null> {
      const { data } = await send(`/api/auth/get-session${fresh ? "?disableCookieCache=true" : ""}`, { method: "GET" });
      return data?.user ?? null;
    },
  };
}

export type Browser = ReturnType<typeof browser>;
