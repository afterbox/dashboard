import { env } from "@/server/env";
import { readTestRecording, receiveTestUpload } from "@/server/storage-test";

/**
 * Test-only: stands in for Supabase Storage's signed URLs in end-to-end test
 * mode (E2E_TEST_MODE=1, never in production). Otherwise a plain 404.
 */
type Context = { params: Promise<{ path: string[] }> };

const target = async (request: Request, context: Context) => ({
  path: (await context.params).path.join("/"),
  token: new URL(request.url).searchParams.get("token"),
});

export async function PUT(request: Request, context: Context) {
  if (!env().testMode) return new Response(null, { status: 404 });
  const { path, token } = await target(request, context);
  const bytes = new Uint8Array(await request.arrayBuffer());
  const status = receiveTestUpload(path, token, request.headers.get("content-type"), bytes);
  return new Response(null, { status });
}

export async function GET(request: Request, context: Context) {
  if (!env().testMode) return new Response(null, { status: 404 });
  const { path, token } = await target(request, context);
  const file = readTestRecording(path, token);
  if (!file) return new Response(null, { status: 404 });
  return new Response(file.bytes.slice().buffer, {
    headers: { "Content-Type": file.contentType, "Cache-Control": "no-store" },
  });
}
