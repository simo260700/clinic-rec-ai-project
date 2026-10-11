/**
 * Session tokens for the single-clinic MVP login (server-only).
 *
 * The cookie holds `<payload>.<signature>`: a base64url JSON payload with the
 * admin email, a password fingerprint and an expiry, signed with HMAC-SHA256
 * using AUTH_SECRET. Nothing secret is stored in it, and it can't be forged or
 * extended without AUTH_SECRET. Changing the admin email, password or
 * AUTH_SECRET invalidates every existing session.
 */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "clinic_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const MIN_SECRET_LENGTH = 32;
let warnedMissingConfig = false;

type AuthConfig = { email: string; password: string; secret: string };
type SessionPayload = { sub: string; pv: string; exp: number };
export type Session = { email: string; expiresAt: number };

/** Reads the auth env vars; null (and a log line without values) if anything is missing. */
export function getAuthConfig(): AuthConfig | null {
  const email = process.env.CLINIC_ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  const password = process.env.CLINIC_ADMIN_PASSWORD ?? "";
  const secret = process.env.AUTH_SECRET ?? "";
  if (!email || !password || secret.length < MIN_SECRET_LENGTH) {
    if (warnedMissingConfig) return null;
    warnedMissingConfig = true;
    console.error(
      `[auth] not configured: set CLINIC_ADMIN_EMAIL, CLINIC_ADMIN_PASSWORD and AUTH_SECRET (min ${MIN_SECRET_LENGTH} chars)`,
    );
    return null;
  }
  return { email, password, secret };
}

/** Constant-time string comparison (hashing first makes the lengths equal). */
export function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
}

/** True if the submitted credentials match the configured admin. Both fields are always compared. */
export function checkCredentials(config: AuthConfig, email: string, password: string): boolean {
  const emailOk = safeEqual(email.trim().toLowerCase(), config.email);
  const passwordOk = safeEqual(password, config.password);
  return emailOk && passwordOk;
}

function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

/** Short keyed fingerprint of the password, so a password change ends old sessions. Never the password itself. */
function passwordFingerprint(config: AuthConfig): string {
  return sign(`pw:${config.password}`, config.secret).slice(0, 22);
}

export function createSessionToken(config: AuthConfig): string {
  const payload: SessionPayload = {
    sub: config.email,
    pv: passwordFingerprint(config),
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body, config.secret)}`;
}

/** Returns the session if the token is authentic, unexpired and matches the current admin; otherwise null. */
export function verifySessionToken(token: string | undefined): Session | null {
  if (!token) return null;
  const config = getAuthConfig();
  if (!config) return null;

  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra !== undefined) return null;
  if (!safeEqual(signature, sign(body, config.secret))) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
  } catch {
    return null;
  }
  if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) return null;
  if (payload.sub !== config.email || payload.pv !== passwordFingerprint(config)) return null;
  return { email: payload.sub, expiresAt: payload.exp * 1000 };
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
