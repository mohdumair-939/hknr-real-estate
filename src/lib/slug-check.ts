import postgres from "postgres";

/*
 * Existence check used by the proxy so unknown listing/project URLs get a real HTTP 404.
 * With Partial Prerendering the page's static shell is sent with a 200 before the page itself
 * can call notFound(), so the check has to happen before rendering. Kept dependency-light
 * (its own tiny pool, no app modules) because the proxy runs separately from render code.
 */

let sql: postgres.Sql | null = null;
const cache = new Map<string, { exists: boolean; at: number }>();
const TTL_MS = 60_000;

function client() {
  sql ??= postgres(process.env.DATABASE_URL!, { max: 2, idle_timeout: 20, connect_timeout: 5, prepare: false });
  return sql;
}

/** Returns false only when the database positively says the slug isn't published. */
export async function publishedSlugExists(kind: "properties" | "projects", slug: string): Promise<boolean> {
  if (!/^[a-z0-9-]{1,200}$/.test(slug)) return false;
  const key = `${kind}:${slug}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.exists;
  try {
    const hideSamples = process.env.APP_ENV === "production";
    const rows =
      kind === "properties"
        ? await client()`select 1 from properties where slug = ${slug} and status = 'published' and (${!hideSamples} or not is_sample) limit 1`
        : await client()`select 1 from projects where slug = ${slug} and status = 'published' and (${!hideSamples} or not is_sample) limit 1`;
    const exists = rows.length > 0;
    if (cache.size > 2000) cache.clear();
    cache.set(key, { exists, at: Date.now() });
    return exists;
  } catch {
    // Database unreachable: let the page render; it shows its own not-found UI with noindex.
    return true;
  }
}
