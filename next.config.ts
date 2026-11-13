import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // End-to-end test mode builds into its own folder, so it can run beside the everyday dev server.
  distDir: process.env.E2E_TEST_MODE === "1" ? ".e2e" : ".next",
  cacheComponents: true,
  // Loaded on demand, in tests and end-to-end test mode only (src/server/db/pglite.ts).
  serverExternalPackages: ["@electric-sql/pglite"],
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
