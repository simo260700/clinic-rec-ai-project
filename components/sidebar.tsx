"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, ChatIcon, LogoutIcon, SettingsIcon } from "@/components/ui/icons";
import { logout } from "@/lib/auth/actions";
import { initials } from "@/lib/format";
import type { StaffUser } from "@/lib/types";

const nav = [
  { href: "/conversations", label: "Conversations", icon: ChatIcon },
  { href: "/appointments", label: "Appointments", icon: CalendarIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function Sidebar({ user }: { user: StaffUser }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-16 shrink-0 flex-col border-r border-zinc-200 bg-white lg:w-60">
      <div className="flex h-16 items-center gap-2.5 px-4 lg:px-5">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-zinc-900 text-[13px] font-semibold text-white">
          CR
        </div>
        <div className="hidden min-w-0 lg:block">
          <p className="truncate text-sm font-semibold tracking-tight text-zinc-900">Clinic Rec AI</p>
          <p className="truncate text-xs text-zinc-500">AI receptionist</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2.5 pt-2 lg:px-3">
        {nav.map(({ href, label, icon: NavIcon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              aria-current={active ? "page" : undefined}
              className={`flex h-9 items-center justify-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-colors lg:justify-start ${
                active ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              <NavIcon className="size-[18px] shrink-0" />
              <span className="hidden lg:inline">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-zinc-100 p-3 lg:px-4">
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 mx-auto lg:mx-0">
          {initials(user.name)}
        </div>
        <div className="hidden min-w-0 flex-1 lg:block">
          <p className="truncate text-[13px] font-medium text-zinc-900">{user.name}</p>
          <p className="truncate text-xs text-zinc-500">{user.role}</p>
        </div>
      </div>
      <form action={logout} className="px-2.5 pb-3 lg:px-3">
        <button
          type="submit"
          title="Log out"
          className="flex h-8 w-full items-center justify-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 lg:justify-start"
        >
          <LogoutIcon className="size-4 shrink-0" />
          <span className="hidden lg:inline">Log out</span>
        </button>
      </form>
    </aside>
  );
}
