import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// The same file Next.js reads. `quiet`, so nothing about the env is printed.
config({ path: ".env.local", quiet: true });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  // Only `npm run db:migrate` connects; `npm run db:generate` works from the schema alone.
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  strict: true,
});
