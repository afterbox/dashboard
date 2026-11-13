import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Unit and integration tests (`npm test`). They run against PGlite, an
 * in-process Postgres, with the same migrations as Supabase, and never touch
 * the network: storage and email are stand-ins (tests/helpers.ts, tests/setup.ts).
 */
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      // Next's guard against importing server code into the browser. It has nothing to guard here.
      "server-only": fileURLToPath(new URL("./tests/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
