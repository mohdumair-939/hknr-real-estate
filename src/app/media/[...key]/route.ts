import { readFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";
import { localRoot } from "@/lib/storage/local";

/**
 * Serves images written by the local storage driver (development only).
 * With STORAGE_DRIVER=s3 images come straight from the bucket's public URL and this returns 404.
 */
export async function GET(_req: Request, ctx: RouteContext<"/media/[...key]">) {
  const { key } = await ctx.params;
  if (env().STORAGE_DRIVER !== "local") return new Response("Not found", { status: 404 });

  // Only `<folder>/<uuid>/<uuid>/<width>.webp` style keys, no traversal.
  const rel = key.join("/");
  if (!/^(properties|projects|site)\/[a-z0-9-]+\/[a-z0-9-]+\/\d{2,4}\.webp$/.test(rel)) {
    return new Response("Not found", { status: 404 });
  }
  const root = localRoot();
  const file = path.resolve(root, rel);
  if (!file.startsWith(root + path.sep)) return new Response("Not found", { status: 404 });

  try {
    const body = await readFile(file);
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
