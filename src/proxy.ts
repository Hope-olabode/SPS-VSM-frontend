import { NextResponse, type NextRequest } from "next/server";

/** Name of the httpOnly cookie the API sets on login (backend-node/src/middleware/auth.js) */
const SESSION_COOKIE = "vms_session";

/**
 * Quick check before a dashboard page loads: no login cookie -> go to the login page.
 * This only looks for the cookie. The API still verifies it on every request, and a 401
 * from the API also sends the user back to login (see src/lib/api.ts).
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const login = new URL("/auth/Login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
