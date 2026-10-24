import "server-only";
import { env } from "@/lib/env";
import { localDriver } from "./local";
import { s3Driver } from "./s3";

export interface StorageDriver {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  /** Deletes every object under each prefix. */
  deletePrefixes(prefixes: string[]): Promise<void>;
}

let driver: StorageDriver | undefined;

export function storage(): StorageDriver {
  driver ??= env().STORAGE_DRIVER === "s3" ? s3Driver() : localDriver();
  return driver;
}

export { assertSafeKey } from "./keys";
