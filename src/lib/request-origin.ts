import type { NextRequest } from "next/server";

/** Prefer proxy headers so redirects work behind Render/Vercel. */
export function getRequestOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost?.split(",")[0]?.trim() || request.headers.get("host");

  if (host && !host.startsWith("localhost") && !host.startsWith("127.0.0.1")) {
    const proto =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
    return `${proto}://${host}`;
  }

  return request.nextUrl.origin;
}
