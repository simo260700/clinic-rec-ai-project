"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import {
  resumeAiConversation,
  sendStaffMessage as sendStaffMessageAction,
  takeOverConversation,
  type ActionResult,
} from "@/app/(dashboard)/conversations/actions";
import type { Conversation, Message, StaffUser } from "@/lib/types";

/**
 * Conversation state + actions.
 *
 *  - takeOver           → n8n dashboard-takeover webhook (via server action), then local update
 *  - resumeAi           → n8n dashboard-resume-ai webhook (via server action), then local update
 *  - sendStaffMessage   → n8n dashboard-send-message webhook (via server action), then local update
 *  - loadHistory        → n8n dashboard-messages (via /api/conversations/messages), merged into the chat
 *  - refreshList        → n8n dashboard-conversations (via /api/conversations), merged into the list
 *
 * The rest are still local-only; each is where a real backend call will go later:
 *  - cancelAppointment  → cancel the Google Calendar event
 */

/** How far apart a local staff message and its server copy may be timestamped (clock skew + latency). */
const LOCAL_MATCH_WINDOW_MS = 5 * 60_000;


export function useConversations(initial: Conversation[], currentUser: StaffUser) {
  const [conversations, setConversations] = useState(initial);
  const router = useRouter();
  /** Background requests answer 401 once the session has expired: go back to the login page. */
  const redirectIfSignedOut = useCallback(
    (res: Response) => {
      if (res.status !== 401) return false;
      router.replace("/login");
      return true;
    },
    [router],
  );
  // Conversations whose chat holds the full n8n history (list refreshes must not overwrite it).
  const historyLoaded = useRef(new Set<string>());
  // Take Over / Resume AI bookkeeping, so a poll can't undo a pending or just-applied mode change.
  const modeActionsInFlight = useRef(new Map<string, number>());
  const modeChangedAt = useRef(new Map<string, number>());

  const update = useCallback((id: string, fn: (c: Conversation) => Conversation) => {
    setConversations((list) => list.map((c) => (c.id === id ? fn(c) : c)));
  }, []);

  const runModeAction = useCallback(
    async (id: string, action: () => Promise<ActionResult>, apply: (c: Conversation) => Conversation) => {
      const inFlight = modeActionsInFlight.current;
      inFlight.set(id, (inFlight.get(id) ?? 0) + 1);
      try {
        const result = await action();
        if (result.ok) {
          modeChangedAt.current.set(id, Date.now());
          update(id, apply);
        }
        return result;
      } finally {
        const left = (inFlight.get(id) ?? 1) - 1;
        if (left > 0) inFlight.set(id, left);
        else inFlight.delete(id);
      }
    },
    [update],
  );

  /** Local state only changes once n8n has confirmed the takeover. */
  const takeOver = useCallback(
    (id: string, phone: string): Promise<ActionResult> =>
      runModeAction(
        id,
        () => takeOverConversation(phone),
        (c) => ({
          ...c,
          mode: "HUMAN",
          handoff: { kind: "manual", reason: "Manual takeover from dashboard", requestedAt: new Date().toISOString() },
          workflow: { pendingAction: "", proposedSlots: "", ...c.workflow, stage: "handoff" },
        }),
      ),
    [runModeAction],
  );

  /** Local state only changes once n8n has confirmed the AI is back on. */
  const resumeAi = useCallback(
    (id: string, phone: string): Promise<ActionResult> =>
      runModeAction(
        id,
        () => resumeAiConversation(phone),
        (c) => ({
          ...c,
          mode: "AI",
          handoff: null,
          workflow: { pendingAction: "", proposedSlots: "", ...c.workflow, stage: "idle" },
        }),
      ),
    [runModeAction],
  );

  /** The message is only added locally once n8n has accepted it. */
  const sendStaffMessage = useCallback(
    async (id: string, phone: string, mode: Conversation["mode"], text: string): Promise<ActionResult> => {
      const message = text.trim();
      if (mode !== "HUMAN") return { ok: false, error: "Take over this conversation before sending messages." };
      if (!message) return { ok: false, error: "Message is empty." };
      const result = await sendStaffMessageAction(phone, message);
      if (!result.ok) return result;
      const sentAt = new Date().toISOString();
      update(id, (c) => ({
        ...c,
        lastMessageAt: c.lastMessageAt === undefined ? undefined : sentAt,
        messages: [
          ...c.messages,
          {
            id: crypto.randomUUID(),
            sender: "staff",
            text: message,
            sentAt,
            authorName: `${currentUser.name.split(" ")[0]} · ${currentUser.role}`,
            local: true,
          },
        ],
      }));
      return result;
    },
    [update, currentUser.name, currentUser.role],
  );

  /**
   * Fetches the full n8n history and merges it into the chat. State is only
   * touched when something actually changed. Resolves false (state untouched) on failure.
   */
  const loadHistory = useCallback(
    async (id: string, phone: string, signal: AbortSignal): Promise<boolean> => {
      const res = await fetch(`/api/conversations/messages?${new URLSearchParams({ phone })}`, { signal, cache: "no-store" });
      if (redirectIfSignedOut(res) || !res.ok) return false;
      const data = (await res.json()) as { messages?: Message[] };
      if (!Array.isArray(data.messages)) return false;
      const fetched = data.messages;
      historyLoaded.current.add(id);
      update(id, (c) => {
        const messages = mergeHistory(c.messages, fetched);
        return sameMessages(c.messages, messages) ? c : { ...c, messages };
      });
      return true;
    },
    [update, redirectIfSignedOut],
  );

  /** Fetches the conversations list and merges it in. Resolves false (state untouched) on failure. */
  const refreshList = useCallback(async (selectedId: string | null, signal: AbortSignal): Promise<boolean> => {
    const startedAt = Date.now();
    const res = await fetch("/api/conversations", { signal, cache: "no-store" });
    if (redirectIfSignedOut(res) || !res.ok) return false;
    const data = (await res.json()) as { conversations?: Conversation[] };
    if (!Array.isArray(data.conversations)) return false;
    const incoming = data.conversations;

    setConversations((list) => {
      const byId = new Map(list.map((c) => [c.id, c]));
      const next = incoming.map((fresh) => {
        const current = byId.get(fresh.id);
        if (!current) {
          // A brand-new conversation counts as unread if the patient wrote to us.
          return fresh.id !== selectedId && fresh.preview?.sender === "patient" ? { ...fresh, unreadCount: 1 } : fresh;
        }
        const merged = mergeConversation(current, fresh, {
          isSelected: fresh.id === selectedId,
          keepMessages: historyLoaded.current.has(fresh.id),
          keepMode:
            modeActionsInFlight.current.has(fresh.id) || (modeChangedAt.current.get(fresh.id) ?? 0) > startedAt,
        });
        return JSON.stringify(merged) === JSON.stringify(current) ? current : merged;
      });
      // Don't yank the open chat away if it briefly disappears from the feed.
      const selected = selectedId ? byId.get(selectedId) : undefined;
      if (selected && !next.some((c) => c.id === selectedId)) next.push(selected);

      const unchanged = next.length === list.length && next.every((c, i) => c === list[i]);
      return unchanged ? list : next;
    });
    return true;
  }, [redirectIfSignedOut]);

  const markRead = useCallback(
    (id: string) => update(id, (c) => (c.unreadCount === 0 ? c : { ...c, unreadCount: 0 })),
    [update],
  );

  const cancelAppointment = useCallback(
    (id: string) =>
      update(id, (c) => (c.appointment ? { ...c, appointment: { ...c.appointment, status: "cancelled" } } : c)),
    [update],
  );

  return { conversations, takeOver, resumeAi, sendStaffMessage, loadHistory, refreshList, markRead, cancelAppointment };
}

/**
 * Server history wins. Local staff messages (just sent) are kept until their
 * server copy appears — matched by sender + text + nearby timestamp — so they
 * never show twice and never vanish in between.
 */
function mergeHistory(current: Message[], fetched: Message[]): Message[] {
  const result = [...fetched];
  const claimed = new Set<number>();
  for (const local of current) {
    if (!local.local) continue;
    const at = Date.parse(local.sentAt);
    const match = result.findIndex(
      (m, i) =>
        !claimed.has(i) &&
        !m.local &&
        m.sender === "staff" &&
        m.text.trim() === local.text.trim() &&
        Math.abs(Date.parse(m.sentAt) - at) < LOCAL_MATCH_WINDOW_MS,
    );
    if (match >= 0) {
      claimed.add(match);
      // Keep the author label shown so far instead of switching to the generic "Staff".
      if (local.authorName && !result[match].authorName) result[match] = { ...result[match], authorName: local.authorName };
    } else {
      result.push(local);
    }
  }
  return result.sort((a, b) => a.sentAt.localeCompare(b.sentAt));
}

function sameMessages(a: Message[], b: Message[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (m, i) =>
        m.id === b[i].id &&
        m.text === b[i].text &&
        m.sentAt === b[i].sentAt &&
        m.sender === b[i].sender &&
        m.authorName === b[i].authorName,
    )
  );
}

function mergeConversation(
  current: Conversation,
  fresh: Conversation,
  { isSelected, keepMessages, keepMode }: { isSelected: boolean; keepMessages: boolean; keepMode: boolean },
): Conversation {
  // n8n only exposes the latest patient text (no inbound timestamp or counter), so a
  // changed text is the signal for a new inbound message. AI/staff replies never count.
  const prevInbound = current.preview?.sender === "patient" ? current.preview.text : null;
  const nextInbound = fresh.preview?.sender === "patient" ? fresh.preview.text : null;
  const newInbound = nextInbound !== null && nextInbound !== prevInbound;

  // Never move backwards (e.g. a poll that started before a local send), so rows don't jump around.
  const lastMessageAt =
    current.lastMessageAt && fresh.lastMessageAt && current.lastMessageAt > fresh.lastMessageAt
      ? current.lastMessageAt
      : (fresh.lastMessageAt ?? current.lastMessageAt);

  return {
    ...current,
    patient: { ...current.patient, name: fresh.patient.name, phone: fresh.patient.phone },
    // The cancel button is still local-only; don't let a refresh silently undo it.
    appointment: current.appointment?.status === "cancelled" ? current.appointment : fresh.appointment,
    lastMessageAt,
    preview: fresh.preview,
    messages: keepMessages ? current.messages : fresh.messages,
    unreadCount: newInbound && !isSelected ? current.unreadCount + 1 : current.unreadCount,
    ...(keepMode ? {} : { mode: fresh.mode, handoff: fresh.handoff, workflow: fresh.workflow }),
  };
}
