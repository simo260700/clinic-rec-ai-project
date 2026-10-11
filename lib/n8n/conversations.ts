/**
 * n8n conversations source (server-only).
 *
 * Reads the conversation state rows that the n8n WhatsApp workflow keeps and
 * maps them into the dashboard's `Conversation` type. Only imported from
 * `lib/data.ts`, which runs in Server Components — the endpoint URL (and any
 * future credential) never reaches the client bundle.
 */
import type { Appointment, Conversation, HandoffKind, Message } from "@/lib/types";

const DEFAULT_ENDPOINT = "https://elcaristfx4.app.n8n.cloud/webhook/dashboard-conversations";
const TIMEOUT_MS = 10_000;

/** Raw row returned by the n8n `dashboard-conversations` webhook. */
type N8nConversationRow = {
  id?: number | string | null;
  phone?: string | null;
  customer_name?: string | null;
  status?: string | null;
  stage?: string | null;
  pending_action?: string | null;
  proposed_slots?: string | null;
  appointment_event_id?: string | null;
  appointment_start?: string | null;
  handoff_reason?: string | null;
  last_user_message?: string | null;
  last_bot_message?: string | null;
  last_message_at?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export async function fetchN8nConversations(): Promise<Conversation[]> {
  const endpoint = process.env.N8N_CONVERSATIONS_URL || DEFAULT_ENDPOINT;
  const headers: HeadersInit = { Accept: "application/json" };
  // Optional shared secret for when the webhook gets protected. Server-side only.
  if (process.env.N8N_WEBHOOK_TOKEN) headers.Authorization = `Bearer ${process.env.N8N_WEBHOOK_TOKEN}`;

  const res = await fetch(endpoint, { headers, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`n8n responded with HTTP ${res.status}`);

  const body: unknown = await res.json();
  const rows = Array.isArray(body) ? body : body && typeof body === "object" ? [body] : [];

  return (rows as N8nConversationRow[])
    .filter((row) => str(row.phone) || row.id != null)
    .map(toConversation)
    .sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""));
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

/** Normalises to ISO 8601 so string sorting and date formatting both work; "" if invalid. */
function iso(value: unknown): string {
  const s = str(value);
  if (!s) return "";
  const ms = Date.parse(s);
  return Number.isNaN(ms) ? "" : new Date(ms).toISOString();
}

function formatPhone(raw: string): string {
  if (!raw || raw.startsWith("+")) return raw;
  return /^\d+$/.test(raw) ? `+${raw}` : raw;
}

function handoffKind(reason: string): HandoffKind {
  return /medic|sintom|symptom|dolor|pain|allerg/i.test(reason) ? "medical" : "administrative";
}

function toConversation(row: N8nConversationRow): Conversation {
  const phone = formatPhone(str(row.phone));
  const id = str(row.id) || phone;
  const lastMessageAt = iso(row.last_message_at) || iso(row.updatedAt) || iso(row.createdAt);

  const userText = str(row.last_user_message);
  const botText = str(row.last_bot_message);
  // Messages need a timestamp to render; a row without any date only shows in the inbox.
  const userMessage: Message | null =
    userText && lastMessageAt ? { id: `${id}-user`, sender: "patient", text: userText, sentAt: lastMessageAt } : null;
  const botMessage: Message | null =
    botText && lastMessageAt ? { id: `${id}-bot`, sender: "ai", text: botText, sentAt: lastMessageAt } : null;
  // n8n only stores the latest exchange: the patient's message followed by the bot's reply.
  const messages = [userMessage, botMessage].filter((m): m is Message => m !== null);

  const handoffReason = str(row.handoff_reason);
  const appointmentStart = iso(row.appointment_start);
  const appointmentEventId = str(row.appointment_event_id);
  const appointment: Appointment | null = appointmentStart
    ? {
        id: appointmentEventId || `${id}-appointment`,
        patientId: id,
        treatment: "Booked via WhatsApp",
        startsAt: appointmentStart,
        status: appointmentEventId ? "confirmed" : "pending",
      }
    : null;

  const stage = str(row.stage);
  const pendingAction = str(row.pending_action);
  const proposedSlots = str(row.proposed_slots);

  return {
    id,
    patient: {
      id: phone || id,
      name: str(row.customer_name) || phone || "Unknown",
      phone,
      treatmentInterest: "",
    },
    mode: str(row.status).toLowerCase() === "human" ? "HUMAN" : "AI",
    unreadCount: 0,
    handoff: handoffReason
      ? { kind: handoffKind(handoffReason), reason: handoffReason, requestedAt: lastMessageAt }
      : null,
    appointment,
    messages,
    lastMessageAt,
    preview: userMessage ?? botMessage,
    workflow: stage || pendingAction || proposedSlots ? { stage, pendingAction, proposedSlots } : null,
  };
}
