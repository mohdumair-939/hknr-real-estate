import path from "node:path";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { connect } from "../../src/lib/db/connect";

/** Applies migrations to the test database once per run. Refuses anything that isn't a *_test database. */
export default async function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgres://hknr:hknr_local_dev@localhost:55433/hknr_test";
  if (!/\/[\w-]*_test(\?|$)/.test(url)) throw new Error(`Refusing to run tests against a non-test database: ${url}`);
  const { db, sql } = connect(url, { max: 1 });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  await sql.end();
}
