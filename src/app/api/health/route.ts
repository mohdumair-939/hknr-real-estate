import { sql } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/lib/db/client";

/** Health check for the hosting platform: 200 when the app can reach the database. */
export async function GET() {
  await connection();
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false, error: "database unreachable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
