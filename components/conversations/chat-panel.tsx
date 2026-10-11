"use client";

import { Fragment, useLayoutEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { AlertIcon, ArrowLeftIcon, InfoIcon, LockIcon, SendIcon } from "@/components/ui/icons";
import { formatDayLabel, formatTime, initials, isSameDay } from "@/lib/format";
import type { Conversation, Message } from "@/lib/types";
import { ModeBadge } from "./status-badges";

/** Within this distance of the bottom, new messages keep the chat pinned to the bottom. */
const NEAR_BOTTOM_PX = 80;

export function ChatPanel({
  conversation,
  now,
  historyState = null,
  onTakeOver,
  onResumeAi,
  onSend,
  onBack,
  onToggleDetails,
}: {
  conversation: Conversation;
  now: string;
  /**
   * Full-history fetch state: "loading" (first load only), "error" (first load failed),
   * "stale" (repeated background refresh failures), null when fine or not fetched.
   */
  historyState?: "loading" | "error" | "stale" | null;
  onTakeOver: () => Promise<{ ok: boolean; error?: string }>;
  onResumeAi: () => Promise<{ ok: boolean; error?: string }>;
  onSend: (text: string) => Promise<{ ok: boolean; error?: string }>;
  onBack: () => void;
  onToggleDetails: () => void;
}) {
  const { patient, mode, messages } = conversation;
  const isHuman = mode === "HUMAN";
  const [draft, setDraft] = useState("");
  const [pendingAction, setPendingAction] = useState<"takeOver" | "resumeAi" | "send" | null>(null);
  const [isPending, startAction] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const takingOver = isPending && pendingAction === "takeOver";
  const resumingAi = isPending && pendingAction === "resumeAi";
  const sending = isPending && pendingAction === "send";
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Scroll bookkeeping: follow new messages only while the reader is at the bottom.
  const pinnedToBottom = useRef(true);
  const lastLayout = useRef<{ firstId?: string; scrollHeight: number }>({ scrollHeight: 0 });

  function handleScroll() {
    const el = scrollRef.current;
    if (el) pinnedToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
  }

  // Runs before paint, so there is no visible jump when refreshed history renders.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const firstId = messages[0]?.id;
    const prev = lastLayout.current;
    if (pinnedToBottom.current) {
      el.scrollTop = el.scrollHeight;
    } else if (prev.firstId !== undefined && firstId !== prev.firstId) {
      // Older messages were inserted above: keep the same messages in view.
      el.scrollTop += el.scrollHeight - prev.scrollHeight;
    }
    lastLayout.current = { firstId, scrollHeight: el.scrollHeight };
  }, [messages]);

  function submit() {
    const text = draft.trim();
    if (!text || !isHuman || isPending) return;
    setActionError(null);
    setPendingAction("send");
    startAction(async () => {
      const result = await onSend(text);
      if (!result.ok) {
        // Keep the draft so staff can retry.
        setActionError(result.error ?? "Message not sent. Please try again.");
        return;
      }
      setDraft("");
      // Your own message should always be visible.
      pinnedToBottom.current = true;
      // Re-focus once the textarea is re-enabled on the next render.
      requestAnimationFrame(() => inputRef.current?.focus());
    });
  }

  function handleTakeOver() {
    setActionError(null);
    setPendingAction("takeOver");
    startAction(async () => {
      const result = await onTakeOver();
      if (!result.ok) {
        setActionError(result.error ?? "Couldn't take over. Please try again.");
        return;
      }
      // Focus once the textarea is re-enabled on the next render.
      requestAnimationFrame(() => inputRef.current?.focus());
    });
  }

  function handleResumeAi() {
    setActionError(null);
    setPendingAction("resumeAi");
    startAction(async () => {
      const result = await onResumeAi();
      if (!result.ok) {
        setActionError(result.error ?? "Couldn't resume AI. Please try again.");
        return;
      }
      setDraft("");
    });
  }

  return (
    <section className="flex h-full min-w-0 flex-col bg-[#f7f7f5]">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-zinc-200 bg-white px-4">
        <button
          type="button"
          onClick={onBack}
          className="-ml-1 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 lg:hidden"
          aria-label="Back to inbox"
        >
          <ArrowLeftIcon className="size-4" />
        </button>
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-zinc-200/70 text-xs font-semibold text-zinc-600">
          {initials(patient.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-[15px] font-semibold text-zinc-900">{patient.name}</h2>
            <ModeBadge mode={mode} long />
          </div>
          <p className="truncate text-xs text-zinc-500 tabular-nums">{patient.phone} · WhatsApp</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant={isHuman ? "secondary" : "primary"} onClick={handleTakeOver} disabled={isHuman || isPending}>
            {takingOver ? "Taking over…" : "Take Over"}
          </Button>
          <Button size="sm" variant="secondary" onClick={handleResumeAi} disabled={!isHuman || isPending}>
            {resumingAi ? "Resuming…" : "Resume AI"}
          </Button>
          <Button size="icon" variant="ghost" onClick={onToggleDetails} className="xl:hidden" aria-label="Patient details">
            <InfoIcon className="size-[18px]" />
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-5 sm:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          {historyState && (
            <div className="flex justify-center" role={historyState === "loading" ? undefined : "status"}>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${
                  historyState === "loading" ? "bg-white text-zinc-500 ring-zinc-200" : "bg-amber-50 text-amber-800 ring-amber-100"
                }`}
              >
                {historyState === "error"
                  ? "Couldn’t load full history — showing latest messages"
                  : historyState === "stale"
                    ? "Couldn’t refresh messages — retrying…"
                    : "Loading history…"}
              </span>
            </div>
          )}
          {messages.length === 0 && historyState !== "loading" && (
            <p className="py-16 text-center text-sm text-zinc-400">No messages yet.</p>
          )}
          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const showDay = !prev || !isSameDay(prev.sentAt, m.sentAt);
            return (
              <Fragment key={m.id}>
                {showDay && (
                  <div className="my-3 flex justify-center">
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-zinc-500 ring-1 ring-zinc-200">
                      {formatDayLabel(m.sentAt, now)}
                    </span>
                  </div>
                )}
                <MessageBubble message={m} />
              </Fragment>
            );
          })}
        </div>
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-zinc-200 bg-white px-4 py-3 sm:px-8">
        <div className="mx-auto max-w-3xl">
          {actionError && (
            <div role="alert" className="mb-2.5 flex items-center gap-2 rounded-lg bg-rose-50/70 px-3 py-2 text-[13px] text-rose-900 ring-1 ring-rose-100">
              <AlertIcon className="size-4 shrink-0 text-rose-600" />
              <p className="flex-1">{actionError}</p>
              <button type="button" onClick={() => setActionError(null)} className="text-xs font-medium text-rose-700 hover:underline">
                Dismiss
              </button>
            </div>
          )}
          {!isHuman && (
            <div className="mb-2.5 flex items-center gap-2 rounded-lg bg-teal-50/70 px-3 py-2 text-[13px] text-teal-900 ring-1 ring-teal-100">
              <LockIcon className="size-4 shrink-0 text-teal-700" />
              <p className="flex-1">The AI receptionist is replying to this patient. Take over to send messages manually.</p>
            </div>
          )}
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <label className="sr-only" htmlFor="composer">
              Message
            </label>
            <textarea
              id="composer"
              ref={inputRef}
              rows={1}
              value={draft}
              disabled={!isHuman || sending}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={isHuman ? `Reply to ${patient.name.split(" ")[0]}…` : "Manual replies are disabled while AI is active"}
              className="max-h-32 min-h-10 flex-1 resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm leading-6 text-zinc-900 placeholder:text-zinc-400 field-sizing-content focus:border-zinc-300 focus:ring-2 focus:ring-teal-600/15 focus:outline-none disabled:cursor-not-allowed disabled:bg-zinc-50"
            />
            <Button type="submit" variant="primary" className="h-10" disabled={!isHuman || isPending || !draft.trim()}>
              <SendIcon className="size-4" />
              {sending ? "Sending…" : "Send"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const fromPatient = message.sender === "patient";
  const isAi = message.sender === "ai";

  const bubble = fromPatient
    ? "bg-white text-zinc-900 ring-1 ring-zinc-200 rounded-bl-sm"
    : isAi
      ? "bg-teal-50 text-zinc-900 ring-1 ring-teal-100 rounded-br-sm"
      : "bg-zinc-900 text-white rounded-br-sm";

  return (
    <div className={`flex ${fromPatient ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 shadow-xs ${bubble}`}>
        {!fromPatient && (
          <p className={`mb-0.5 text-[11px] font-semibold ${isAi ? "text-teal-700" : "text-zinc-300"}`}>
            {isAi ? "AI receptionist" : (message.authorName ?? "Staff")}
          </p>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
        <p
          className={`mt-1 text-right text-[10.5px] tabular-nums ${
            fromPatient ? "text-zinc-400" : isAi ? "text-teal-700/60" : "text-zinc-400"
          }`}
        >
          <time dateTime={message.sentAt}>{formatTime(message.sentAt)}</time>
        </p>
      </div>
    </div>
  );
}
