// Applies pending SQL migrations from ./drizzle. Plain JS with runtime dependencies only,
// so it runs on the host (e.g. Render build step) without dev tooling.
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
try {
  console.log("Applying migrations…");
  await migrate(drizzle(sql), { migrationsFolder: path.join(process.cwd(), "drizzle") });
  console.log("Migrations applied.");
} catch (err) {
  console.error("Migration failed:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await sql.end();
}
