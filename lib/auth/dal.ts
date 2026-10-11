/**
 * Auth checks for server code (pages, Server Actions, route handlers).
 * The proxy already redirects signed-out visitors; these re-check the session
 * right next to the data, as recommended, so nothing relies on the proxy alone.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken, type Session } from "./session";

export async function getSession(): Promise<Session | null> {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

/** For pages and Server Actions: sends signed-out users to /login. */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** For API route handlers: a 401 response when signed out, otherwise null. */
export async function unauthorizedResponse(): Promise<Response | null> {
  return (await getSession()) ? null : Response.json({ error: "Unauthorized" }, { status: 401 });
}
