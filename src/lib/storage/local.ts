import "server-only";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";
import { assertSafeKey } from "./keys";
import type { StorageDriver } from "./index";

export function localRoot(): string {
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), env().LOCAL_STORAGE_DIR);
}

/** Development driver: files on local disk, served by /media/[...key]. Not for hosted production. */
export function localDriver(): StorageDriver {
  const root = localRoot();
  return {
    async put(key, body) {
      assertSafeKey(key);
      const file = path.join(root, key);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, body);
    },
    async deletePrefixes(prefixes) {
      for (const prefix of prefixes) {
        assertSafeKey(prefix);
        await rm(path.join(root, prefix), { recursive: true, force: true });
      }
    },
  };
}
