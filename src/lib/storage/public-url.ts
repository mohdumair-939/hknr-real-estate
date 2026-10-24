/**
 * Builds public image URLs. Free of server-only imports so cached components can use it;
 * the base URL is public information.
 */
const base = (
  process.env.STORAGE_DRIVER === "s3" && process.env.S3_PUBLIC_BASE_URL ? process.env.S3_PUBLIC_BASE_URL : "/media"
).replace(/\/$/, "");

export function mediaUrl(storageKey: string, width: number): string {
  return `${base}/${storageKey}/${width}.webp`;
}
