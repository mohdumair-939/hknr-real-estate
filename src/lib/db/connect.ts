import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Creates a Drizzle client. Shared by the app (via `client.ts`) and CLI scripts,
 * so it must not import `server-only` or the Next-specific env module.
 */
export function connect(url: string, opts: { max?: number } = {}) {
  const sql = postgres(url, {
    max: opts.max ?? 10,
    idle_timeout: 20,
    connect_timeout: 10,
    // Managed Postgres poolers (Supabase/Neon transaction mode) do not support prepared statements.
    prepare: false,
    onnotice: () => {},
  });
  return { db: drizzle(sql, { schema }), sql };
}

export type Database = ReturnType<typeof connect>["db"];
