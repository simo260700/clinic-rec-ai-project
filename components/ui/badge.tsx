import type { ReactNode } from "react";

const tones = {
  neutral: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  ai: "bg-teal-50 text-teal-800 ring-teal-200",
  human: "bg-amber-50 text-amber-800 ring-amber-200",
  medical: "bg-rose-50 text-rose-700 ring-rose-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  muted: "bg-zinc-50 text-zinc-500 ring-zinc-200",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({
  tone = "neutral",
  dot = false,
  children,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold tracking-wide uppercase ring-1 ring-inset ${tones[tone]}`}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
