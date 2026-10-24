import "server-only";
import { z } from "zod";

const optional = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional();

const schema = z
  .object({
    APP_ENV: z.enum(["development", "test", "preview", "production"]).default("development"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    /** Public origin, e.g. https://hknr.onrender.com. Canonicals and sitemap URLs use it. */
    SITE_URL: optional.pipe(z.url().optional()),
    /** Search engines may index the site only when this is "true". Off by default (previews, temporary URLs). */
    ALLOW_INDEXING: z.enum(["true", "false"]).default("false"),
    /** Salt for hashing client IPs (rate limiting / abuse). Required outside development. */
    IP_HASH_SALT: optional,
    STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
    LOCAL_STORAGE_DIR: z.string().default(".data/uploads"),
    S3_ENDPOINT: optional,
    S3_REGION: z.string().default("auto"),
    S3_BUCKET: optional,
    S3_ACCESS_KEY_ID: optional,
    S3_SECRET_ACCESS_KEY: optional,
    /** Public base URL that serves objects from the bucket (CDN or public bucket URL). */
    S3_PUBLIC_BASE_URL: optional.pipe(z.url().optional()),
    RESEND_API_KEY: optional,
    EMAIL_FROM: optional,
  })
  .superRefine((env, ctx) => {
    const strict = env.APP_ENV === "production" || env.APP_ENV === "preview";
    if (strict && !env.IP_HASH_SALT) {
      ctx.addIssue({ code: "custom", path: ["IP_HASH_SALT"], message: "required outside development" });
    }
    if (env.APP_ENV === "production" && env.STORAGE_DRIVER === "local") {
      ctx.addIssue({
        code: "custom",
        path: ["STORAGE_DRIVER"],
        message: "local storage is ephemeral on hosted platforms; use s3 in production",
      });
    }
    if (env.STORAGE_DRIVER === "s3") {
      for (const key of [
        "S3_ENDPOINT",
        "S3_BUCKET",
        "S3_ACCESS_KEY_ID",
        "S3_SECRET_ACCESS_KEY",
        "S3_PUBLIC_BASE_URL",
      ] as const) {
        if (!env[key]) ctx.addIssue({ code: "custom", path: [key], message: "required when STORAGE_DRIVER=s3" });
      }
    }
    if (env.RESEND_API_KEY && !env.EMAIL_FROM) {
      ctx.addIssue({ code: "custom", path: ["EMAIL_FROM"], message: "required when RESEND_API_KEY is set" });
    }
  });

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** Validated server environment. Throws with every problem listed, never with values. */
export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }
  cached = parsed.data;
  return cached;
}

export const isProduction = () => env().APP_ENV === "production";

/** Sample (synthetic) content is only ever visible outside production. */
export const showSampleContent = () => env().APP_ENV !== "production";
