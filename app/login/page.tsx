import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="grid size-10 place-items-center rounded-xl bg-zinc-900 text-sm font-semibold text-white">CR</div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Clinic Rec AI</h1>
            <p className="text-sm text-zinc-500">Sign in to your clinic dashboard</p>
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-xs ring-1 ring-zinc-200">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
