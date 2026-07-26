import { NextRequest, NextResponse } from "next/server";

import {
  AUTH_COOKIE_NAME,
  getAppPasscode,
  verifyAuthToken,
} from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === "/login";
  const isLoginApi = pathname === "/api/login";
  const isLogoutApi = pathname === "/api/logout";

  if (isLoginApi || isLogoutApi) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = await verifyAuthToken(token, getAppPasscode());

  if (isLoginPage) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
