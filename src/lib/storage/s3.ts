import "server-only";
import { DeleteObjectsCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";
import { assertSafeKey } from "./keys";
import type { StorageDriver } from "./index";

/** Any S3-compatible bucket: Cloudflare R2, Supabase Storage (S3 protocol) or AWS S3. */
export function s3Driver(): StorageDriver {
  const e = env();
  const client = new S3Client({
    region: e.S3_REGION,
    endpoint: e.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: { accessKeyId: e.S3_ACCESS_KEY_ID!, secretAccessKey: e.S3_SECRET_ACCESS_KEY! },
  });
  const Bucket = e.S3_BUCKET!;
  return {
    async put(key, body, contentType) {
      assertSafeKey(key);
      await client.send(
        new PutObjectCommand({
          Bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          // Keys contain random ids and are never overwritten, so they can be cached forever.
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
    },
    async deletePrefixes(prefixes) {
      for (const prefix of prefixes) {
        assertSafeKey(prefix);
        const listed = await client.send(new ListObjectsV2Command({ Bucket, Prefix: `${prefix}/` }));
        const objects = (listed.Contents ?? []).flatMap((o) => (o.Key ? [{ Key: o.Key }] : []));
        if (objects.length) await client.send(new DeleteObjectsCommand({ Bucket, Delete: { Objects: objects } }));
      }
    },
  };
}
