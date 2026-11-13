// `npm run db:migrate`: apply the migrations in drizzle/ to the database named in .env.local.
//
// This does what `drizzle-kit migrate` does, with the same bookkeeping table,
// so the two can be mixed. It exists because drizzle-kit says nothing at all
// when it can't connect: it stops after "Using 'postgres' driver" and exits 1.
// Here a failure says why, in plain words, and never prints the connection
// string or anything in it.
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config({ path: ".env.local", quiet: true });

const raw = process.env.DATABASE_URL ?? "";
const stop = (message) => {
  console.error(`\nMigrations were not applied.\n${message}\n`);
  process.exit(1);
};

if (!raw) stop("DATABASE_URL is empty. Set it in .env.local.");

let url;
try {
  url = new URL(raw);
} catch {
  stop("DATABASE_URL is not a valid connection string. Paste it again from Supabase: Connect, then Session pooler.");
}

const direct = /^db\..+\.supabase\.co$/.test(url.hostname);
const pooler = "In Supabase, open Connect, copy the Session pooler string, and put it in DATABASE_URL in .env.local.";

/** Everything in the connection string, kept out of whatever is printed. */
const decoded = (part) => {
  try {
    return decodeURIComponent(part);
  } catch {
    return part;
  }
};
const secrets = [raw, url.hostname, url.username, url.password, decoded(url.password)]
  .filter((part) => part.length > 2)
  .sort((a, b) => b.length - a.length);
const safe = (text) => secrets.reduce((out, part) => out.split(part).join("[hidden]"), String(text));

const reasonFor = (problem) => {
  const code = problem?.code ?? problem?.cause?.code;
  const unreachable = ["ENOTFOUND", "EAI_AGAIN", "ENETUNREACH", "EHOSTUNREACH", "EADDRNOTAVAIL"].includes(code);
  if (unreachable && direct) {
    return `DATABASE_URL is Supabase's direct connection, which only works over IPv6, and this network has no IPv6.\n${pooler}`;
  }
  if (unreachable) return "The database host could not be found. Check the host in DATABASE_URL, and your connection.";
  if (code === "CONNECT_TIMEOUT" || code === "ETIMEDOUT") {
    return `The database did not answer in time.${direct ? `\n${pooler}` : " Check your connection, and that the project is not paused."}`;
  }
  if (code === "ECONNREFUSED") return "The database refused the connection. Check the port in DATABASE_URL.";
  if (code === "28P01") return "The database password in DATABASE_URL was refused. Reset it in Supabase, or paste the string again.";
  if (code === "XX000" || code === "08006") {
    return `The pooler did not recognise this project or user. ${pooler}`;
  }
  return `${code ? `${code}: ` : ""}${safe(problem?.message ?? problem)}`;
};

const sql = postgres(raw, { prepare: false, max: 1, connect_timeout: 15, onnotice: () => {} });

/** How many migrations the database has on record. None, before the first. */
const recorded = async () => {
  const [{ found }] = await sql`select to_regclass('drizzle.__drizzle_migrations') as found`;
  if (!found) return 0;
  const [{ count }] = await sql`select count(*)::int as count from drizzle.__drizzle_migrations`;
  return count;
};

try {
  const before = await recorded();
  await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
  const applied = (await recorded()) - before;
  console.log(applied > 0 ? `Applied ${applied} migration${applied === 1 ? "" : "s"}.` : "Already up to date.");
} catch (problem) {
  await sql.end({ timeout: 5 }).catch(() => {});
  stop(reasonFor(problem));
}
await sql.end({ timeout: 5 });
