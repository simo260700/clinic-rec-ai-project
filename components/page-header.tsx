import type { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-zinc-200 bg-white px-6">
      <div className="min-w-0">
        <h1 className="truncate text-[15px] font-semibold tracking-tight text-zinc-900">{title}</h1>
        {description && <p className="truncate text-xs text-zinc-500">{description}</p>}
      </div>
      {actions}
    </header>
  );
}
