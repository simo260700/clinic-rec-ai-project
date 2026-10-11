import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

/**
 * Gatekeeper for the whole app: signed-out visitors are sent to /login (API
 * routes get a 401 instead), signed-in visitors skip the login page. Pages,
 * Server Actions and API routes re-check the session themselves as well.
 */
/** Files served from /public (images, icons, robots.txt…) stay public. */
const PUBLIC_FILE = /\.(?:svg|png|jpe?g|gif|webp|avif|ico|txt|xml|webmanifest|woff2?)$/i;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_FILE.test(pathname) && !pathname.startsWith("/api/")) return NextResponse.next();
  const signedIn = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value) !== null;

  if (pathname === "/login") {
    return signedIn ? NextResponse.redirect(new URL("/conversations", request.url)) : NextResponse.next();
  }
  if (signedIn) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    // Everything except Next.js build assets and image optimisation; public files are let through above.
    // (Keep this pattern free of regex escapes: the matcher compiler drops backslashes.)
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
