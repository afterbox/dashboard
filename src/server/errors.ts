import type { ApiErrorCode } from "@/lib/schemas";

const statuses: Record<ApiErrorCode, number> = {
  unauthenticated: 401,
  invalid_input: 400,
  not_found: 404,
  upgrade_required: 402,
  sign_up_required: 403,
  step_not_reached: 409,
  upload_invalid: 400,
  too_many_requests: 429,
  server_error: 500,
};

/**
 * Something a person did that we can't do, said in a sentence they can read.
 * Services throw these; the route wrapper (./api.ts) turns them into JSON.
 */
export class AppError extends Error {
  readonly status: number;

  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "AppError";
    this.status = statuses[code];
  }
}

/**
 * Not theirs, or not there: the same answer either way, so nobody can learn
 * what exists in someone else's account.
 */
export const notFound = (what = "that") => new AppError("not_found", `We couldn't find ${what}.`);

/** The free plan is one person. The UI turns this into the offer, never an error. */
export const upgradeRequired = () =>
  new AppError(
    "upgrade_required",
    "The free plan is for one person you love. Building gifts for everyone is part of the paid plan.",
  );
