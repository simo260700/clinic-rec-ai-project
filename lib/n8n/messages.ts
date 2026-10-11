/**
 * n8n message history source (server-only).
 *
 * Reads the per-phone message log kept by the n8n WhatsApp workflow and maps
 * it into the dashboard's `Message` type. Only imported from server code, so
 * the endpoint URL and token never reach the client bundle.
 */
import type { Message, MessageSender } from "@/lib/types";

const ENDPOINT = "https://elcaristfx4.app.n8n.cloud/webhook/dashboard-messages";
const TIMEOUT_MS = 10_000;

/** Raw row returned by the n8n `dashboard-messages` webhook. */
type N8nMessageRow = {
  id?: number | string | null;
  message_id?: string | null;
  direction?: string | null;
  sender?: string | null;
  message_text?: string | null;
  source?: string | null;
  message_at?: string | null;
  createdAt?: string | null;
};

/** `phone` must already be digits only. Returns messages oldest → newest. */
export async function fetchN8nMessages(phone: string): Promise<Message[]> {
  const token = process.env.N8N_WEBHOOK_TOKEN;
  if (!token) throw new Error("N8N_WEBHOOK_TOKEN is not set");

  const url = `${ENDPOINT}?${new URLSearchParams({ phone })}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`n8n responded with HTTP ${res.status}`);

  // n8n may answer an empty result with no body or `{}` instead of `[]`.
  const text = await res.text();
  const body: unknown = text.trim() ? JSON.parse(text) : [];
  const rows = Array.isArray(body) ? body : body && typeof body === "object" && Object.keys(body).length ? [body] : [];

  return (rows as N8nMessageRow[])
    .map((row, index) => ({ message: toMessage(row), order: Number(row.id) || index }))
    .filter((entry): entry is { message: Message; order: number } => entry.message !== null)
    // Ascending by timestamp; the row id breaks ties between identical timestamps.
    .sort((a, b) => a.message.sentAt.localeCompare(b.message.sentAt) || a.order - b.order)
    .map((entry) => entry.message);
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function toSender(row: N8nMessageRow): MessageSender {
  if (str(row.direction).toLowerCase() === "inbound") return "patient";
  // Outbound: anything not explicitly from staff was sent by the AI receptionist.
  return str(row.sender).toLowerCase() === "staff" || str(row.source).toLowerCase() === "dashboard" ? "staff" : "ai";
}

function toMessage(row: N8nMessageRow): Message | null {
  const text = str(row.message_text);
  const ms = Date.parse(str(row.message_at) || str(row.createdAt));
  if (!text || Number.isNaN(ms)) return null;
  const sender = toSender(row);
  const sentAt = new Date(ms).toISOString();
  return {
    // Prefer the row id; otherwise a composite key that stays stable across polls.
    id: str(row.id) || str(row.message_id) || `${sender}|${sentAt}|${text}`,
    sender,
    text,
    sentAt,
  };
}
