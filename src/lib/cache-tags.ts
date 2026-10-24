/** Cache tags used by public queries (lib/queries/public.ts) and invalidated by admin actions. */
export const TAGS = {
  properties: "properties",
  projects: "projects",
  services: "services",
  settings: "settings",
  localities: "localities",
} as const;

export type CacheTag = (typeof TAGS)[keyof typeof TAGS];
