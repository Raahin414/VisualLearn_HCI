import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export function newReturnToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}
function requireSecret(secret: string) {
  if (Buffer.byteLength(secret) < 32)
    throw new Error("SESSION_SECRET must contain at least 32 bytes");
}
export function signSession(id: string, secret: string, now = Date.now()) {
  requireSecret(secret);
  const payload = Buffer.from(
    JSON.stringify({ id, exp: now + 8 * 24 * 60 * 60_000 }),
  ).toString("base64url");
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
}
export function verifySession(
  cookie: string,
  secret: string,
  now = Date.now(),
): string | null {
  requireSecret(secret);
  try {
    const [payload, sig, ...extra] = cookie.split(".");
    if (extra.length || !payload || !sig) return null;
    const expected = createHmac("sha256", secret).update(payload).digest();
    const actual = Buffer.from(sig, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof data.id === "string" &&
      /^[0-9a-f-]{36}$/i.test(data.id) &&
      Number.isFinite(data.exp) &&
      data.exp > now
      ? data.id
      : null;
  } catch {
    return null;
  }
}
