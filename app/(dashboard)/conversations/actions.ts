"use server";

/**
 * Conversation write actions. These run on the server only, so the n8n token
 * never reaches the browser.
 */
import { requireSession } from "@/lib/auth/dal";
import { fetchN8nConversations } from "@/lib/n8n/conversations";

const TAKEOVER_ENDPOINT = "https://elcaristfx4.app.n8n.cloud/webhook/dashboard-takeover";
const RESUME_AI_ENDPOINT = "https://elcaristfx4.app.n8n.cloud/webhook/dashboard-resume-ai";
const SEND_MESSAGE_ENDPOINT = "https://elcaristfx4.app.n8n.cloud/webhook/dashboard-send-message";
const TIMEOUT_MS = 10_000;
/** WhatsApp text message limit. */
const MAX_MESSAGE_LENGTH = 4096;

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Asks n8n to pause the AI receptionist for this phone so staff can reply manually. */
export async function takeOverConversation(phone: string): Promise<ActionResult> {
  await requireSession();
  const digits = normalizePhone(phone);
  if (!digits) return { ok: false, error: "Invalid phone number." };
  return postToN8n(TAKEOVER_ENDPOINT, { phone: digits }, { tag: "takeover", label: "Take over", failure: "Couldn't take over." });
}

/** Asks n8n to hand this phone back to the AI receptionist. */
export async function resumeAiConversation(phone: string): Promise<ActionResult> {
  await requireSession();
  const digits = normalizePhone(phone);
  if (!digits) return { ok: false, error: "Invalid phone number." };
  return postToN8n(RESUME_AI_ENDPOINT, { phone: digits }, { tag: "resume-ai", label: "Resume AI", failure: "Couldn't resume AI." });
}

/** Sends a staff message to the patient on WhatsApp. Only allowed while the conversation is in HUMAN mode. */
export async function sendStaffMessage(phone: string, message: string): Promise<ActionResult> {
  await requireSession();
  const digits = normalizePhone(phone);
  if (!digits) return { ok: false, error: "Invalid phone number." };
  const text = typeof message === "string" ? message.trim() : "";
  if (!text) return { ok: false, error: "Message is empty." };
  if (text.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: `Message is too long (max ${MAX_MESSAGE_LENGTH} characters).` };
  }

  // Server Actions can be called directly, so verify the mode with n8n instead of trusting the client.
  try {
    const conversation = (await fetchN8nConversations()).find((c) => normalizePhone(c.patient.phone) === digits);
    if (!conversation) return { ok: false, error: "Conversation not found." };
    if (conversation.mode !== "HUMAN") return { ok: false, error: "Take over this conversation before sending messages." };
  } catch (err) {
    console.error("[send-message] couldn't verify conversation mode:", err instanceof Error ? err.message : err);
    return { ok: false, error: "Couldn't verify the conversation. Please try again." };
  }

  return postToN8n(
    SEND_MESSAGE_ENDPOINT,
    { phone: digits, message: text },
    { tag: "send-message", label: "Sending", failure: "Message not sent." },
  );
}

/** n8n stores WhatsApp numbers as plain digits (e.g. "393667051817"). Returns "" if invalid. */
function normalizePhone(phone: unknown): string {
  const digits = typeof phone === "string" ? phone.replace(/\D/g, "") : "";
  return digits.length >= 6 && digits.length <= 15 ? digits : "";
}

async function postToN8n(
  endpoint: string,
  payload: Record<string, string>,
  { tag, label, failure }: { tag: string; label: string; failure: string },
): Promise<ActionResult> {
  const token = process.env.N8N_WEBHOOK_TOKEN;
  if (!token) {
    console.error(`[${tag}] N8N_WEBHOOK_TOKEN is not set`);
    return { ok: false, error: `${label} is not configured.` };
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`[${tag}] n8n responded with HTTP ${res.status}`);
      return { ok: false, error: `${failure} Please try again.` };
    }
    // Treat an explicit `{ success: false }` / `{ ok: false }` reply as a failure too.
    const body: unknown = await res.json().catch(() => null);
    if (body && typeof body === "object" && ("success" in body || "ok" in body)) {
      const flag = "success" in body ? body.success : (body as { ok: unknown }).ok;
      if (flag === false) {
        console.error(`[${tag}] n8n reported failure`);
        return { ok: false, error: `${failure} Please try again.` };
      }
    }
    return { ok: true };
  } catch (err) {
    console.error(`[${tag}] request failed:`, err instanceof Error ? err.message : err);
    return { ok: false, error: "Couldn't reach the server. Please try again." };
  }
}
