"use client";

import { SearchIcon } from "@/components/ui/icons";
import { formatListTimestamp, initials } from "@/lib/format";
import type { Conversation } from "@/lib/types";
import { HandoffBadge, ModeBadge } from "./status-badges";

export function ConversationList({
  conversations,
  selectedId,
  query,
  onQueryChange,
  onSelect,
  now,
  notice,
}: {
  conversations: Conversation[];
  selectedId: string | null;
  query: string;
  onQueryChange: (q: string) => void;
  onSelect: (id: string) => void;
  now: string;
  notice?: string;
}) {
  const humanCount = conversations.filter((c) => c.mode === "HUMAN").length;

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-3 border-b border-zinc-200 px-4 pt-4 pb-3">
        <div className="flex items-baseline justify-between">
          <h1 className="text-[15px] font-semibold tracking-tight text-zinc-900">Inbox</h1>
          <p className="text-xs text-zinc-500">
            {humanCount} need{humanCount === 1 ? "s" : ""} staff
          </p>
        </div>
        <label className="relative block">
          <span className="sr-only">Search conversations</span>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search name, phone or message"
            className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 pr-3 pl-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white focus:ring-2 focus:ring-teal-600/15 focus:outline-none"
          />
        </label>
        {notice && (
          <p role="status" className="rounded-lg bg-amber-50/70 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-100">
            {notice}
          </p>
        )}
      </div>

      <ul className="flex-1 overflow-y-auto">
        {conversations.length === 0 && (
          <li className="px-4 py-10 text-center text-sm text-zinc-500">
            {query.trim() ? <>No conversations match “{query}”.</> : "No conversations yet."}
          </li>
        )}
        {conversations.map((c) => {
          const last = c.preview ?? c.messages.at(-1);
          const lastAt = c.lastMessageAt || last?.sentAt;
          const selected = c.id === selectedId;
          return (
            <li key={c.id} className="border-b border-zinc-100">
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                aria-current={selected ? "true" : undefined}
                className={`relative flex w-full gap-3 px-4 py-3 text-left transition-colors ${
                  selected ? "bg-zinc-100/80" : "hover:bg-zinc-50"
                }`}
              >
                {selected && <span className="absolute inset-y-2 left-0 w-0.5 rounded-r bg-zinc-900" />}
                <div className="grid size-9 shrink-0 place-items-center rounded-full bg-zinc-200/70 text-xs font-semibold text-zinc-600">
                  {initials(c.patient.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={`truncate text-sm text-zinc-900 ${c.unreadCount ? "font-semibold" : "font-medium"}`}>
                      {c.patient.name}
                    </p>
                    {lastAt && (
                      <span className={`shrink-0 text-[11px] ${c.unreadCount ? "font-medium text-teal-700" : "text-zinc-400"}`}>
                        {formatListTimestamp(lastAt, now)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 tabular-nums">{c.patient.phone}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <p className={`min-w-0 flex-1 truncate text-[13px] ${c.unreadCount ? "text-zinc-800" : "text-zinc-500"}`}>
                      {last ? `${last.sender === "patient" ? "" : last.sender === "ai" ? "AI: " : "You: "}${last.text}` : "No messages"}
                    </p>
                    {c.unreadCount > 0 && (
                      <span className="grid h-[18px] min-w-[18px] shrink-0 place-items-center rounded-full bg-teal-700 px-1 text-[10.5px] font-semibold text-white">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <ModeBadge mode={c.mode} />
                    <HandoffBadge conversation={c} />
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
