import { connection } from "next/server";
import { unauthorizedResponse } from "@/lib/auth/dal";
import { getConversations } from "@/lib/data";

/**
 * GET /api/conversations
 *
 * Server-side proxy for the n8n conversations list, used by the dashboard's
 * background refresh. Never falls back to mock data: a failure is a 502 so the
 * client keeps its last good state.
 */
export async function GET() {
  await connection();
  const unauthorized = await unauthorizedResponse();
  if (unauthorized) return unauthorized;
  const { conversations, source } = await getConversations();
  if (source !== "n8n") {
    return Response.json({ error: "Couldn't load conversations." }, { status: 502 });
  }
  return Response.json({ conversations }, { headers: { "Cache-Control": "no-store" } });
}
