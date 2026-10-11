"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { AlertIcon } from "@/components/ui/icons";
import { login, type LoginState } from "@/lib/auth/actions";

const inputClass =
  "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-2 focus:ring-teal-600/15 focus:outline-none";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, { error: null });

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-[13px] font-medium text-zinc-700">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required autoFocus className={inputClass} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-[13px] font-medium text-zinc-700">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </div>
      {state.error && (
        <p role="alert" className="flex items-center gap-2 rounded-lg bg-rose-50/70 px-3 py-2 text-[13px] text-rose-900 ring-1 ring-rose-100">
          <AlertIcon className="size-4 shrink-0 text-rose-600" />
          {state.error}
        </p>
      )}
      <Button type="submit" variant="primary" className="h-10 w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
