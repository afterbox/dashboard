import "server-only";
import { baseContentType, recordingRules } from "@/lib/schemas";
import { env } from "./env";
import type { RecordingStore } from "./storage";

/**
 * A stand-in for Supabase Storage, for end-to-end test mode only
 * (E2E_TEST_MODE=1, never in production). Recordings are held in memory and
 * served by /api/test/storage, behind the same kind of single-purpose tokens,
 * and with the same limits the real bucket enforces.
 */
type Stored = { bytes: Uint8Array; contentType: string };

const memory = globalThis as typeof globalThis & {
  __afterboxTestRecordings?: {
    files: Map<string, Stored>;
    /** token → the one path it may write to. Used once. */
    uploads: Map<string, string>;
    /** token → the one path it may read, and when it stops working. */
    plays: Map<string, { path: string; expiresAt: number }>;
  };
};

function state() {
  if (!env().testMode) throw new Error("The test recording store only exists in end-to-end test mode.");
  memory.__afterboxTestRecordings ??= { files: new Map(), uploads: new Map(), plays: new Map() };
  return memory.__afterboxTestRecordings;
}

const url = (path: string, token: string) =>
  `${env().BETTER_AUTH_URL.replace(/\/$/, "")}/api/test/storage/${path}?token=${token}`;

export function testRecordingStore(): RecordingStore {
  return {
    async createUploadUrl(path) {
      const token = crypto.randomUUID();
      state().uploads.set(token, path);
      return url(path, token);
    },
    async createPlaybackUrl(path, expiresInSeconds) {
      const token = crypto.randomUUID();
      state().plays.set(token, { path, expiresAt: Date.now() + expiresInSeconds * 1000 });
      return url(path, token);
    },
    async stat(path) {
      const file = state().files.get(path);
      return file ? { sizeBytes: file.bytes.byteLength, contentType: file.contentType } : null;
    },
    async remove(paths) {
      for (const path of paths) state().files.delete(path);
    },
  };
}

/** PUT to a signed upload URL. Answers with an HTTP status, as Storage would. */
export function receiveTestUpload(path: string, token: string | null, contentType: string | null, bytes: Uint8Array) {
  const { uploads, files } = state();
  if (!token || uploads.get(token) !== path) return 403;
  const type = baseContentType(contentType ?? "");
  if (!(type in recordingRules.types)) return 415;
  if (bytes.byteLength === 0 || bytes.byteLength > recordingRules.maxBytes) return 413;
  uploads.delete(token);
  files.set(path, { bytes, contentType: type });
  return 200;
}

/** GET a signed playback URL. */
export function readTestRecording(path: string, token: string | null): Stored | null {
  const { plays, files } = state();
  const grant = token ? plays.get(token) : undefined;
  if (!grant || grant.path !== path || grant.expiresAt < Date.now()) return null;
  return files.get(path) ?? null;
}
