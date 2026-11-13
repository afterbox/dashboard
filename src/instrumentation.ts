/**
 * Runs once when the server starts: check the environment, so a missing
 * variable is a clear error at startup rather than a surprise on someone's
 * first request. Names and reasons only; never a value.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { env } = await import("./server/env");
  env();
}
