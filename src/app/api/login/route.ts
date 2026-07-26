import { NextResponse } from "next/server";

import {
  AUTH_COOKIE_MAX_AGE,
  AUTH_COOKIE_NAME,
  createAuthToken,
  getAppPasscode,
} from "@/lib/auth";

export async function POST(request: Request) {
  const passcode = getAppPasscode();

  if (!passcode) {
    return NextResponse.json(
      { error: "App passcode is not configured." },
      { status: 500 }
    );
  }

  let body: { passcode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (body.passcode !== passcode) {
    return NextResponse.json(
      { error: "Incorrect passcode, try again." },
      { status: 401 }
    );
  }

  const token = await createAuthToken(passcode);
  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
  });

  return response;
}
