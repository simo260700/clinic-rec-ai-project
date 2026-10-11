"use client";

import { useCallback, useMemo, useState } from "react";
import { isSameDay } from "@/lib/format";
import type { Conversation, StaffUser } from "@/lib/types";
import { ChatPanel } from "./chat-panel";
import { ConversationList } from "./conversation-list";
import { PatientPanel } from "./patient-panel";
import { useConversations } from "./use-conversations";
import { usePolling } from "./use-polling";

/** Open chat history refresh interval. */
const HISTORY_POLL_MS = 3_000;
/** Conversation list refresh interval. */
const LIST_POLL_MS = 5_000;
/** Consecutive background failures before a (small) warning is shown. */
const FAILURES_BEFORE_WARNING = 3;

type HistoryStatus = { loaded: boolean; failures: number };

function lastActivity(c: Conversation): string {
  return c.lastMessageAt ?? c.messages.at(-1)?.sentAt ?? "";
}

function matches(c: Conversation, q: string): boolean {
  if (!q) return true;
  const digits = q.replace(/\D/g, "");
  return (
    c.patient.name.toLowerCase().includes(q) ||
    (digits.length > 0 && c.patient.phone.replace(/\D/g, "").includes(digits)) ||
    c.messages.some((m) => m.text.toLowerCase().includes(q))
  );
}

export function ConversationsWorkspace({
  initialConversations,
  currentUser,
  now: initialNow,
  notice,
  source,
}: {
  initialConversations: Conversation[];
  currentUser: StaffUser;
  now: string;
  /** Data-source warning shown above the inbox (e.g. n8n unreachable). */
  notice?: string;
  /** Where the initial list came from. Mock fallback data is never refreshed. */
  source: "n8n" | "mock" | "error";
}) {
  const { conversations, takeOver, resumeAi, sendStaffMessage, loadHistory, refreshList, markRead, cancelAppointment } =
    useConversations(initialConversations, currentUser);
  // Becomes true after the first successful refresh if the page loaded without n8n data.
  const [live, setLive] = useState(source === "n8n");
  const [now, setNow] = useState(initialNow);
  const [listFailures, setListFailures] = useState(0);
  // Per-conversation history status; no entry yet means the first load is in flight.
  const [historyStatus, setHistoryStatus] = useState<Record<string, HistoryStatus>>({});
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Small screens show one pane at a time; the patient panel becomes a drawer below xl.
  const [mobilePane, setMobilePane] = useState<"list" | "chat">("list");
  const [detailsOpen, setDetailsOpen] = useState(false);

  const sorted = useMemo(
    () => [...conversations].sort((a, b) => lastActivity(b).localeCompare(lastActivity(a))),
    [conversations],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((c) => matches(c, q));
  }, [sorted, query]);

  const selected = conversations.find((c) => c.id === selectedId) ?? sorted[0] ?? null;
  const selectedKey = selected?.id;
  const selectedPhone = selected?.patient.phone;

  // Open chat: load immediately on selection, then refresh every few seconds.
  // A failed refresh keeps whatever is on screen.
  const pollHistory = useCallback(
    async (signal: AbortSignal) => {
      if (!selectedKey || !selectedPhone) return;
      let ok = false;
      try {
        ok = await loadHistory(selectedKey, selectedPhone, signal);
      } catch (err) {
        if (signal.aborted) return;
        console.warn("[conversations] history refresh failed:", err instanceof Error ? err.message : err);
      }
      if (signal.aborted) return;
      setHistoryStatus((all) => {
        const prev = all[selectedKey] ?? { loaded: false, failures: 0 };
        const next = ok ? { loaded: true, failures: 0 } : { loaded: prev.loaded, failures: prev.failures + 1 };
        return prev.loaded === next.loaded && prev.failures === next.failures && all[selectedKey]
          ? all
          : { ...all, [selectedKey]: next };
      });
    },
    [selectedKey, selectedPhone, loadHistory],
  );
  usePolling(pollHistory, {
    intervalMs: HISTORY_POLL_MS,
    enabled: live && !!selectedKey,
    immediate: true,
    resetKey: `${selectedKey}|${selectedPhone}`,
  });

  // Inbox: refresh every few seconds; the initial list came from the server render.
  const pollList = useCallback(
    async (signal: AbortSignal) => {
      let ok = false;
      try {
        ok = await refreshList(selectedKey ?? null, signal);
      } catch (err) {
        if (signal.aborted) return;
        console.warn("[conversations] list refresh failed:", err instanceof Error ? err.message : err);
      }
      if (signal.aborted) return;
      setListFailures((n) => (ok ? 0 : n + 1));
      if (!ok) return;
      setLive(true);
      // Keep "Today" / "Yesterday" labels correct across midnight without re-rendering every poll.
      const current = new Date().toISOString();
      setNow((prev) => (isSameDay(prev, current) ? prev : current));
    },
    [refreshList, selectedKey],
  );
  usePolling(pollList, { intervalMs: LIST_POLL_MS, enabled: source !== "mock" });

  const status = selected ? historyStatus[selected.id] : undefined;
  const historyState: "loading" | "error" | "stale" | null =
    !live || !selected
      ? null
      : !status
        ? "loading"
        : !status.loaded
          ? status.failures > 0
            ? "error"
            : "loading"
          : status.failures >= FAILURES_BEFORE_WARNING
            ? "stale"
            : null;
  const listNotice = live
    ? listFailures >= FAILURES_BEFORE_WARNING
      ? "Couldn't refresh conversations — retrying…"
      : undefined
    : notice;

  function select(id: string) {
    setSelectedId(id);
    setMobilePane("chat");
    setDetailsOpen(false);
    markRead(id);
  }

  return (
    <div className="flex h-full min-h-0">
      <div
        className={`w-full shrink-0 border-r border-zinc-200 bg-white lg:block lg:w-[340px] ${
          mobilePane === "list" ? "block" : "hidden"
        }`}
      >
        <ConversationList
          conversations={filtered}
          selectedId={selected?.id ?? null}
          query={query}
          onQueryChange={setQuery}
          onSelect={select}
          now={now}
          notice={listNotice}
        />
      </div>

      {selected ? (
        <>
          <div className={`min-w-0 flex-1 lg:block ${mobilePane === "chat" ? "block" : "hidden"}`}>
            <ChatPanel
              key={selected.id}
              conversation={selected}
              now={now}
              historyState={historyState}
              onTakeOver={() => takeOver(selected.id, selected.patient.phone)}
              onResumeAi={() => resumeAi(selected.id, selected.patient.phone)}
              onSend={(text) => sendStaffMessage(selected.id, selected.patient.phone, selected.mode, text)}
              onBack={() => setMobilePane("list")}
              onToggleDetails={() => setDetailsOpen((o) => !o)}
            />
          </div>

          {detailsOpen && (
            <div className="fixed inset-0 z-30 bg-zinc-900/20 xl:hidden" onClick={() => setDetailsOpen(false)} aria-hidden="true" />
          )}
          <div
            className={`fixed inset-y-0 right-0 z-40 w-[340px] max-w-full border-l border-zinc-200 shadow-xl transition-transform xl:static xl:z-auto xl:w-[320px] xl:shrink-0 xl:translate-x-0 xl:shadow-none ${
              detailsOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <PatientPanel
              key={selected.id}
              conversation={selected}
              onCancelAppointment={() => cancelAppointment(selected.id)}
              onClose={() => setDetailsOpen(false)}
            />
          </div>
        </>
      ) : (
        <div className="hidden flex-1 place-items-center text-sm text-zinc-500 lg:grid">Select a conversation</div>
      )}
    </div>
  );
}
