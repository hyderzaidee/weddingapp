import { NextRequest, NextResponse } from "next/server";

import {
  AUTH_COOKIE_NAME,
  getAppPasscode,
  verifyAuthToken,
} from "@/lib/auth";
import { getRequestOrigin } from "@/lib/request-origin";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = getRequestOrigin(request);

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
      return NextResponse.redirect(new URL("/", origin));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except Next internals and public static files.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)",
  ],
};
