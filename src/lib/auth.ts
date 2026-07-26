export const AUTH_COOKIE_NAME = "wedding-app-auth";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 6; // 6 hours
const AUTH_PAYLOAD = "wedding-app-authenticated";

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function getSigningKey(passcode: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passcode),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

export async function createAuthToken(passcode: string): Promise<string> {
  const key = await getSigningKey(passcode);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(AUTH_PAYLOAD)
  );
  return toHex(signature);
}

export async function verifyAuthToken(
  token: string | undefined,
  passcode: string | undefined
): Promise<boolean> {
  if (!token || !passcode) {
    return false;
  }

  const expected = await createAuthToken(passcode);
  return timingSafeEqual(token, expected);
}

export function getAppPasscode(): string | undefined {
  const passcode = process.env.APP_PASSCODE;
  return passcode && passcode.length > 0 ? passcode : undefined;
}
