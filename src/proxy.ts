import { NextResponse, type NextRequest } from "next/server";
import { publishedSlugExists } from "@/lib/slug-check";

const COOKIE = process.env.NODE_ENV === "production" ? "__Host-hknr_session" : "hknr_session";

/**
 * Runs before rendering for two jobs:
 *
 * 1. Optimistic gate for /admin: visitors without a session cookie go to the login page.
 *    This is NOT the security boundary; every admin page, action and route handler verifies
 *    the session against the database (src/lib/auth/dal.ts).
 * 2. Real HTTP 404s for unknown listing/project URLs (see lib/slug-check.ts).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const detail = /^\/(properties|projects)\/([^/]+)\/?$/.exec(pathname);
  if (detail) {
    const exists = await publishedSlugExists(detail[1] as "properties" | "projects", decodeURIComponent(detail[2]));
    if (!exists) {
      const url = request.nextUrl.clone();
      url.pathname = "/not-found-page";
      return NextResponse.rewrite(url, { status: 404 });
    }
    return NextResponse.next();
  }

  if (pathname === "/admin/login") return NextResponse.next();
  if (!request.cookies.has(COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = pathname === "/admin" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// /admin/api is excluded: the upload handler authenticates itself, and passing large
// uploads through the proxy would buffer them in memory (proxyClientMaxBodySize).
export const config = {
  matcher: ["/admin", "/admin/((?!api/).*)", "/properties/:slug", "/projects/:slug"],
};
