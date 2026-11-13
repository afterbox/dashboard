import { homeHintCookie } from "./hints";
import type { Step } from "./onboarding";
import type {
  ApiErrorBody,
  ApiErrorCode,
  Gift,
  GiftCreate,
  MessageInput,
  OnboardingState,
  Person,
  PersonCreate,
  PersonUpdate,
  PlanChoice,
  PracticalItem,
  PracticalItemCreate,
  Preference,
  PreferenceUpdate,
  UploadRequest,
  UploadTicket,
} from "./schemas";

/**
 * The browser's side of /api: one typed function per endpoint. The session
 * travels in an httpOnly cookie the browser sends by itself; nothing here ever
 * holds a key or a token.
 */

/** Something went wrong, with a sentence that is safe to show. */
export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly status: number,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const offline = "We couldn't reach afterbox. Check your connection and try again.";
const unexpected = "Something went wrong on our side. Nothing was lost. Try again in a moment.";

type SendOptions = {
  /** Finish sending even if the page is closed or reloaded straight after. For small things only. */
  keepalive?: boolean;
};

async function send(method: string, path: string, body?: unknown, options: SendOptions = {}): Promise<Response> {
  try {
    return await fetch(path, {
      method,
      credentials: "same-origin",
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      keepalive: options.keepalive,
    });
  } catch {
    throw new ApiError("server_error", offline, 0);
  }
}

async function request<T>(method: string, path: string, body?: unknown, options?: SendOptions): Promise<T> {
  const response = await send(method, path, body, options);
  if (response.status === 204) return undefined as T;
  const data = (await response.json().catch(() => null)) as T | ApiErrorBody | null;
  if (!response.ok) {
    const error = (data as ApiErrorBody | null)?.error;
    throw new ApiError(error?.code ?? "server_error", error?.message ?? unexpected, response.status, error?.fields);
  }
  return data as T;
}

/** Better Auth answers in its own shape. These are its refusals, in our words. */
const authMessages: Record<string, string> = {
  INVALID_OTP: "That code doesn't match. Check it and try again.",
  OTP_EXPIRED: "That code has run out. Ask for a new one.",
  TOO_MANY_ATTEMPTS: "That's a few tries too many. Ask for a new code.",
  INVALID_EMAIL: "That email address doesn't look right.",
};

async function authRequest<T>(path: string, body: unknown = {}): Promise<T> {
  const response = await send("POST", `/api/auth${path}`, body);
  const data = (await response.json().catch(() => null)) as (T & { code?: string; message?: string }) | null;
  if (!response.ok) {
    const tooMany = response.status === 429;
    // Our own limiter writes its message for people; Better Auth's is replaced with ours.
    const ours = tooMany && data?.code === "TOO_MANY_REQUESTS" ? data.message : undefined;
    const message =
      (data?.code && authMessages[data.code]) ??
      ours ??
      (tooMany ? "That's a few tries too many. Wait a minute, then try again." : unexpected);
    throw new ApiError(tooMany ? "too_many_requests" : "invalid_input", message, response.status);
  }
  return data as T;
}

const forgetHomeHint = () => {
  document.cookie = `${homeHintCookie}=; path=/; max-age=0`;
  document.documentElement.removeAttribute("data-member");
};

export const api = {
  session: {
    get: () => request<OnboardingState>("GET", "/api/session"),
    /** Begin as a guest, so what they make is kept from the first screen. Harmless if they already have a session. */
    begin: () => request<OnboardingState>("POST", "/api/session"),
  },
  onboarding: {
    save: (step: Step, input?: unknown) => request<OnboardingState>("POST", "/api/onboarding", { step, input }),
    complete: () => request<OnboardingState>("POST", "/api/onboarding/complete"),
  },
  people: {
    list: () => request<{ people: Person[] }>("GET", "/api/people").then((r) => r.people),
    create: (input: PersonCreate) => request<{ person: Person }>("POST", "/api/people", input).then((r) => r.person),
    update: (id: string, input: PersonUpdate) =>
      request<{ person: Person }>("PATCH", `/api/people/${id}`, input).then((r) => r.person),
    remove: (id: string) => request<void>("DELETE", `/api/people/${id}`),
  },
  gifts: {
    list: () => request<{ gifts: Gift[] }>("GET", "/api/gifts").then((r) => r.gifts),
    uploadUrl: (input: UploadRequest) => request<UploadTicket>("POST", "/api/gifts/upload-url", input),
    create: (input: GiftCreate) => request<{ gift: Gift }>("POST", "/api/gifts", input).then((r) => r.gift),
    playback: (id: string) => request<{ url: string; contentType: string | null }>("GET", `/api/gifts/${id}/playback`),
    remove: (id: string) => request<void>("DELETE", `/api/gifts/${id}`),
  },
  practical: {
    list: () => request<{ items: PracticalItem[] }>("GET", "/api/practical-items").then((r) => r.items),
    create: (input: PracticalItemCreate) =>
      request<{ item: PracticalItem }>("POST", "/api/practical-items", input).then((r) => r.item),
    remove: (id: string) => request<void>("DELETE", `/api/practical-items/${id}`),
  },
  preferences: {
    get: () => request<{ preference: Preference }>("GET", "/api/preferences").then((r) => r.preference),
    /** A choice made a moment before closing the tab (the theme, often) still gets saved. */
    update: (input: PreferenceUpdate) =>
      request<{ preference: Preference }>("PATCH", "/api/preferences", input, { keepalive: true }).then(
        (r) => r.preference,
      ),
  },
  plan: {
    choose: (choice: PlanChoice) => request<{ choice: PlanChoice }>("POST", "/api/plan", { choice }),
  },
  auth: {
    /** Email a 6-digit code. */
    sendCode: (email: string) => authRequest<{ success: boolean }>("/email-otp/send-verification-otp", { email, type: "sign-in" }),
    /** Sign in with it. A guest's work moves to the account as part of this. */
    signIn: (email: string, code: string) => authRequest<unknown>("/sign-in/email-otp", { email, otp: code }),
    /** Only offered when Google is configured. Leaves the page for Google. */
    async google(callbackURL: string) {
      const { url } = await authRequest<{ url: string }>("/sign-in/social", { provider: "google", callbackURL });
      window.location.assign(url);
    },
    /** How they sign their gifts ("Dad"). */
    setName: (name: string) => authRequest<unknown>("/update-user", { name }),
    async signOut() {
      await authRequest("/sign-out");
      forgetHomeHint();
    },
    async signOutEverywhere() {
      await authRequest("/revoke-sessions");
      forgetHomeHint();
    },
  },
};

/**
 * Send a recording: ask where it may go, PUT it there (straight to storage,
 * through a short-lived signed URL), and hand back what sealing it needs.
 */
export async function uploadRecording(recording: Blob, seconds: number) {
  const durationSeconds = Math.max(1, Math.round(seconds));
  const ticket = await api.gifts.uploadUrl({
    contentType: recording.type,
    sizeBytes: recording.size,
    durationSeconds,
  });
  let stored: Response;
  try {
    stored = await fetch(ticket.uploadUrl, {
      method: "PUT",
      headers: { "content-type": ticket.contentType },
      body: recording,
    });
  } catch {
    throw new ApiError("server_error", offline, 0);
  }
  if (!stored.ok) {
    throw new ApiError("upload_invalid", "We couldn't keep that recording. Try once more?", stored.status);
  }
  return { storagePath: ticket.storagePath, durationSeconds };
}

/** A message as the composer hands it over: a recording still to be sent, or a letter. */
export type Draft =
  | { kind: "voice"; recording: Blob; seconds: number; envelopeTitle: string }
  | { kind: "letter"; letterText: string; envelopeTitle: string };

/** Turn a draft into what the API seals, uploading the recording if there is one. */
export async function prepareMessage(draft: Draft): Promise<MessageInput> {
  if (draft.kind === "letter") {
    return { kind: "letter", envelopeTitle: draft.envelopeTitle, letterText: draft.letterText };
  }
  const { storagePath, durationSeconds } = await uploadRecording(draft.recording, draft.seconds);
  return { kind: "voice", envelopeTitle: draft.envelopeTitle, storagePath, durationSeconds };
}

export const errorMessage = (error: unknown) => (error instanceof ApiError ? error.message : unexpected);
