import "server-only";
import { env } from "@/lib/env";
import { connect, type Database } from "./connect";

export type { Database };

// Reuse one pool across hot reloads in development.
const globalForDb = globalThis as unknown as { __hknrDb?: Database };

export const db: Database = globalForDb.__hknrDb ?? connect(env().DATABASE_URL).db;
if (process.env.NODE_ENV !== "production") globalForDb.__hknrDb = db;
