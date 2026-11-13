import type { z } from "zod";
import { AppError } from "./errors";

/**
 * Check input against a schema. On failure, an `invalid_input` error whose
 * message is the first problem, in a sentence, with the first problem for each
 * field alongside. It never echoes back what was sent.
 */
export function parseInput<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;

  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = issue.path.join(".") || "_";
    fields[field] ??= issue.message;
  }
  const first = result.error.issues[0]?.message ?? "Something in that didn't look right.";
  throw new AppError("invalid_input", first, fields);
}
