import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * What differs between development, production and test mode: where the code
 * email is sent from, whether the code is ever logged, and whether the
 * test-only hooks exist. Each test loads the modules fresh under its own
 * environment; Resend itself is mocked.
 */

type SendResult = { data: { id: string } | null; error: { name: string; message?: string } | null };
const send = vi.fn<(message: unknown) => Promise<SendResult>>(async () => ({ data: { id: "email_1" }, error: null }));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

const logged = () =>
  [console.info, console.log, console.warn, console.error, console.debug]
    .flatMap((fn) => vi.mocked(fn).mock.calls)
    .flat()
    .map(String)
    .join("\n");

beforeEach(() => {
  vi.resetModules();
  send.mockClear();
  for (const method of ["info", "log", "warn", "error", "debug"] as const) {
    vi.spyOn(console, method).mockImplementation(() => {});
  }
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("the code email", () => {
  it("development: sent from Resend's test address, and the code is also logged to the server console", async () => {
    vi.stubEnv("E2E_TEST_MODE", "");
    vi.stubEnv("NODE_ENV", "development");
    const { sendCode } = await import("@/server/email");

    await sendCode({ to: "dad@example.com", code: "482913", personName: "Mary" });

    expect(send).toHaveBeenCalledTimes(1);
    const [message] = send.mock.calls[0] as [{ from: string; to: string; subject: string; text: string }];
    expect(message.from).toBe("afterbox <onboarding@resend.dev>");
    expect(message.to).toBe("dad@example.com");
    expect(message.text).toContain("Your afterbox code is 482913. It keeps your gift for Mary safe.");
    expect(logged()).toContain("482913");
  });

  it("production: sent from our own address, and the code is never logged", async () => {
    vi.stubEnv("E2E_TEST_MODE", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("EMAIL_FROM", "afterbox <hello@afterbox.co.uk>");
    const { sendCode } = await import("@/server/email");

    await sendCode({ to: "dad@example.com", code: "482913", personName: "Mary" });

    expect(send).toHaveBeenCalledTimes(1);
    const [message] = send.mock.calls[0] as [{ from: string }];
    expect(message.from).toBe("afterbox <hello@afterbox.co.uk>");
    expect(logged()).not.toContain("482913");
  });

  it("production: if the email can't be sent, sign-in fails, and still nothing secret is logged", async () => {
    vi.stubEnv("E2E_TEST_MODE", "");
    vi.stubEnv("NODE_ENV", "production");
    send.mockResolvedValueOnce({
      data: null,
      error: { name: "validation_error", message: "Your code 482913 couldn't go to dad@example.com." },
    });
    const { sendCode } = await import("@/server/email");

    await expect(sendCode({ to: "dad@example.com", code: "482913" })).rejects.toThrow(/couldn't be sent/);
    const output = logged();
    expect(output).not.toContain("482913");
    expect(output).not.toContain(process.env.RESEND_API_KEY as string);
  });

  it("test mode: nothing is sent or logged; the code waits for the test-only hook", async () => {
    const { sendCode, testCodeFor } = await import("@/server/email");
    await sendCode({ to: "Dad@Example.com", code: "482913" });

    expect(send).not.toHaveBeenCalled();
    expect(logged()).not.toContain("482913");
    expect(testCodeFor("dad@example.com")).toBe("482913");
    expect(testCodeFor("someone-else@example.com")).toBeNull();
  });
});

describe("the test-only hooks", () => {
  const origin = "http://localhost:3000";

  it("exist in test mode", async () => {
    const { sendCode } = await import("@/server/email");
    await sendCode({ to: "dad@example.com", code: "482913" });
    const otp = await import("@/app/api/test/otp/route");

    const found = await otp.GET(new Request(`${origin}/api/test/otp?email=dad@example.com`));
    expect(found.status).toBe(200);
    expect(await found.json()).toEqual({ code: "482913" });
    expect((await otp.GET(new Request(`${origin}/api/test/otp?email=nobody@example.com`))).status).toBe(404);
  });

  it.each(["development", "production"])("are a plain 404 in %s", async (mode) => {
    // In test mode first, so there is a code to (not) find.
    const before = await import("@/server/email");
    await before.sendCode({ to: "dad@example.com", code: "482913" });

    vi.resetModules();
    vi.stubEnv("E2E_TEST_MODE", "");
    vi.stubEnv("NODE_ENV", mode);
    const otp = await import("@/app/api/test/otp/route");
    const storage = await import("@/app/api/test/storage/[...path]/route");
    const { testCodeFor } = await import("@/server/email");

    const response = await otp.GET(new Request(`${origin}/api/test/otp?email=dad@example.com`));
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("");
    expect(testCodeFor("dad@example.com")).toBeNull();

    const params = { params: Promise.resolve({ path: ["someone", "file.webm"] }) };
    const put = await storage.PUT(
      new Request(`${origin}/api/test/storage/someone/file.webm?token=x`, { method: "PUT", body: "x" }),
      params,
    );
    expect(put.status).toBe(404);
    const get = await storage.GET(new Request(`${origin}/api/test/storage/someone/file.webm?token=x`), params);
    expect(get.status).toBe(404);
  });

  it("the app refuses to start in production with test mode on", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { env } = await import("@/server/env");
    expect(() => env()).toThrow(/E2E_TEST_MODE must never be set in production/);
  });
});
