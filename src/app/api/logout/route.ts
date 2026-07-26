import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { getRequestOrigin } from "@/lib/request-origin";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL("/login", getRequestOrigin(request)),
    303
  );

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
