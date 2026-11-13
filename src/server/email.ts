import "server-only";
import { Resend } from "resend";
import { env } from "./env";

/**
 * Email, through Resend. One email so far: the sign-in code.
 *
 * - Development: sent from EMAIL_FROM once it is set (a domain verified in
 *   Resend); until then from Resend's shared test address, which only
 *   delivers to the Resend account's own email. The code is also written to
 *   the server console so sign-in works without an inbox.
 * - Production: sent from EMAIL_FROM. The code is never logged.
 * - End-to-end test mode: nothing is sent; the code is kept in memory for
 *   /api/test/otp.
 */

export type CodeEmail = {
  to: string;
  code: string;
  /** Who the gift is for, when we know: "It keeps your gift for Mary safe." */
  personName?: string | null;
};

export type SendCode = (email: CodeEmail) => Promise<void>;

const devSender = "afterbox <onboarding@resend.dev>";
const defaultSender = "afterbox <hello@afterbox.co.uk>";

/** A name is the user's own words: keep it to one plain line before it goes in an email. */
const plainName = (name?: string | null) => name?.replace(/[\r\n<>]/g, " ").trim().slice(0, 60) || null;

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** The code email, in the brand voice. Exported for tests. */
export function codeEmail({ code, personName }: Pick<CodeEmail, "code" | "personName">) {
  const name = plainName(personName);
  const keeps = name ? `It keeps your gift for ${name} safe.` : "It keeps what you've made safe.";
  const lasts = "It works for 5 minutes, and only once.";
  const notYou = "If you didn't ask for this, you can ignore it. Nothing will change.";
  const never = "We never ask for passwords, PINs or card numbers.";

  const text = [`Your afterbox code is ${code}. ${keeps}`, lasts, notYou, never, "afterbox"].join("\n\n");

  // Email clients don't read our stylesheet, so the brand colours are written out here (docs/tokens.json).
  const html = `<!doctype html>
<html lang="en-GB">
  <body style="margin:0;padding:32px 20px;background:#fbf6ef;color:#2a1b1f;font-family:Figtree,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;line-height:1.55;">
    <div style="max-width:440px;margin:0 auto;">
      <p style="margin:0 0 24px;font-family:Fraunces,Georgia,serif;font-size:22px;">afterbox</p>
      <p style="margin:0 0 8px;">Your afterbox code is</p>
      <p style="margin:0 0 16px;font-size:34px;letter-spacing:6px;font-weight:600;">${escapeHtml(code)}</p>
      <p style="margin:0 0 16px;">${escapeHtml(keeps)}</p>
      <p style="margin:0 0 16px;color:#6e5a5c;">${escapeHtml(lasts)}</p>
      <p style="margin:0 0 16px;color:#6e5a5c;">${escapeHtml(notYou)}</p>
      <p style="margin:0;color:#6e5a5c;">${escapeHtml(never)}</p>
    </div>
  </body>
</html>`;

  return { subject: `Your afterbox code is ${code}`, text, html };
}

// ── End-to-end test mode ────────────────────────────────────────────────────

const memory = globalThis as typeof globalThis & { __afterboxTestCodes?: Map<string, string> };

/** The latest code sent to an address. Only exists in end-to-end test mode. */
export function testCodeFor(email: string): string | null {
  if (!env().testMode) return null;
  return memory.__afterboxTestCodes?.get(email.trim().toLowerCase()) ?? null;
}

// ── Sending ─────────────────────────────────────────────────────────────────

let resend: Resend | undefined;

export const sendCode: SendCode = async ({ to, code, personName }) => {
  const { testMode, production, RESEND_API_KEY, EMAIL_FROM } = env();

  if (testMode) {
    memory.__afterboxTestCodes ??= new Map();
    memory.__afterboxTestCodes.set(to.trim().toLowerCase(), code);
    return;
  }

  if (!production) {
    // Development only, so sign-in works before the sending domain is verified.
    console.info(`[afterbox dev] Sign-in code for ${to}: ${code}`);
  }

  resend ??= new Resend(RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: EMAIL_FROM ?? (production ? defaultSender : devSender),
    to,
    ...codeEmail({ code, personName }),
  });

  if (error) {
    // Resend's reason (it names the rule, never the key), never the code. In development the code is in the console, so carry on.
    const reason = (error.message ?? "").replace(/\b\d{6}\b/g, "[code]");
    console.error(`[afterbox] The sign-in email couldn't be sent (${error.name})${reason ? `: ${reason}` : "."}`);
    if (production) throw new Error("The sign-in email couldn't be sent.");
  }
};
