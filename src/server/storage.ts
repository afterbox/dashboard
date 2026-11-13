import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { recordingRules } from "@/lib/schemas";
import { env } from "./env";

/**
 * Where recordings are kept: Supabase Storage, in the private bucket
 * `recordings`, reached only from here with the secret key. The browser never
 * sees a key: it is handed a signed URL for one file, for a short time.
 *
 * Services depend on this small interface, not on Supabase, so tests can stand
 * in for it (tests/helpers.ts) and so can end-to-end test mode (./storage-test.ts).
 */
export interface RecordingStore {
  /** A signed URL the browser can PUT one recording to, at exactly this path. */
  createUploadUrl(path: string): Promise<string>;
  /** A signed URL to play one recording, for this many seconds. */
  createPlaybackUrl(path: string, expiresInSeconds: number): Promise<string>;
  /** What is stored at a path, or null if nothing is. */
  stat(path: string): Promise<{ sizeBytes: number; contentType: string | null } | null>;
  /** Remove recordings. Missing ones are not an error. */
  remove(paths: string[]): Promise<void>;
}

export const recordingsBucket = "recordings";

/** Storage failed. The message never includes a path, a URL or a key. */
export class StorageError extends Error {
  constructor(doing: string) {
    super(`Storage: couldn't ${doing}.`);
    this.name = "StorageError";
  }
}

class SupabaseRecordingStore implements RecordingStore {
  private bucketReady: Promise<void> | undefined;

  constructor(private readonly client: SupabaseClient) {}

  private get bucket() {
    return this.client.storage.from(recordingsBucket);
  }

  /**
   * Make sure the bucket exists, private, and that Storage itself refuses
   * anything that isn't a small audio file. Checked once per server start.
   */
  private ensureBucket() {
    this.bucketReady ??= (async () => {
      const settings = {
        public: false,
        fileSizeLimit: recordingRules.maxBytes,
        allowedMimeTypes: Object.keys(recordingRules.types),
      };
      const existing = await this.client.storage.getBucket(recordingsBucket);
      if (existing.data) {
        // Never leave it public, whatever happened in the dashboard.
        if (existing.data.public) {
          const { error } = await this.client.storage.updateBucket(recordingsBucket, settings);
          if (error) throw new StorageError("make the recordings bucket private");
        }
        return;
      }
      const { error } = await this.client.storage.createBucket(recordingsBucket, settings);
      // Two servers starting at once can both try; the second finds it already made.
      if (error && !/exist/i.test(error.message)) throw new StorageError("create the recordings bucket");
    })().catch((error) => {
      this.bucketReady = undefined;
      throw error;
    });
    return this.bucketReady;
  }

  async createUploadUrl(path: string) {
    await this.ensureBucket();
    const { data, error } = await this.bucket.createSignedUploadUrl(path);
    if (error || !data) throw new StorageError("prepare the upload");
    return data.signedUrl;
  }

  async createPlaybackUrl(path: string, expiresInSeconds: number) {
    const { data, error } = await this.bucket.createSignedUrl(path, expiresInSeconds);
    if (error || !data) throw new StorageError("prepare the recording for playing");
    return data.signedUrl;
  }

  async stat(path: string) {
    const { data, error } = await this.bucket.info(path);
    if (error || !data) return null;
    return { sizeBytes: data.size ?? 0, contentType: data.contentType ?? null };
  }

  async remove(paths: string[]) {
    if (paths.length === 0) return;
    const { error } = await this.bucket.remove(paths);
    if (error) throw new StorageError("remove a recording");
  }
}

const store = globalThis as typeof globalThis & { __afterboxRecordings?: Promise<RecordingStore> };

async function connect(): Promise<RecordingStore> {
  const { testMode, SUPABASE_URL, SUPABASE_SECRET_KEY } = env();
  if (testMode) {
    const { testRecordingStore } = await import("./storage-test");
    return testRecordingStore();
  }
  const client = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    // A server-side client: no browser session to keep or refresh.
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return new SupabaseRecordingStore(client);
}

export function getRecordingStore(): Promise<RecordingStore> {
  store.__afterboxRecordings ??= connect();
  return store.__afterboxRecordings;
}
