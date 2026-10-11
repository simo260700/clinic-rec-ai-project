"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkCredentials, createSessionToken, getAuthConfig, SESSION_COOKIE, sessionCookieOptions } from "./session";

export type LoginState = { error: string | null };

/** Small fixed delay on failed sign-ins to slow down password guessing. */
const FAILED_LOGIN_DELAY_MS = 600;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const config = getAuthConfig();
  if (!config || !email || !password || !checkCredentials(config, email, password)) {
    await new Promise((resolve) => setTimeout(resolve, FAILED_LOGIN_DELAY_MS));
    return { error: "Invalid email or password" };
  }

  (await cookies()).set(SESSION_COOKIE, createSessionToken(config), sessionCookieOptions());
  redirect("/conversations");
}

export async function logout(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  redirect("/login");
}
