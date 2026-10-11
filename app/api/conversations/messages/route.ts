import type { NextRequest } from "next/server";
import { unauthorizedResponse } from "@/lib/auth/dal";
import { getConversationMessages } from "@/lib/data";

/**
 * GET /api/conversations/messages?phone=<phone>
 *
 * Server-side proxy for the n8n message history, so the browser never sees
 * the n8n URL or token.
 */
export async function GET(request: NextRequest) {
  const unauthorized = await unauthorizedResponse();
  if (unauthorized) return unauthorized;
  const phone = (request.nextUrl.searchParams.get("phone") ?? "").replace(/\D/g, "");
  if (phone.length < 6 || phone.length > 15) {
    return Response.json({ error: "Invalid phone number." }, { status: 400 });
  }

  try {
    const messages = await getConversationMessages(phone);
    return Response.json({ messages }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[messages] n8n fetch failed:", err instanceof Error ? err.message : err);
    return Response.json({ error: "Couldn't load message history." }, { status: 502 });
  }
}
