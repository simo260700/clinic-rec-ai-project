import type { Metadata } from "next";
import { connection } from "next/server";
import { requireSession } from "@/lib/auth/dal";
import { ConversationsWorkspace } from "@/components/conversations/conversations-workspace";
import { getConversations, getCurrentUser, getReferenceNow } from "@/lib/data";

export const metadata: Metadata = { title: "Conversations" };

export default async function ConversationsPage() {
  // Always render per request so the inbox reflects the latest n8n state.
  await connection();
  await requireSession();
  const [{ conversations, source }, currentUser] = await Promise.all([getConversations(), getCurrentUser()]);

  const notice =
    source === "mock"
      ? "Couldn't reach n8n — showing mock data (development only)."
      : source === "error"
        ? "Couldn't load conversations. Please refresh to try again."
        : undefined;
  // Mock timestamps are pinned to a fixed "now"; live data uses the real clock.
  const now = source === "mock" ? getReferenceNow() : new Date().toISOString();

  return (
    <ConversationsWorkspace initialConversations={conversations} currentUser={currentUser} now={now} notice={notice} source={source} />
  );
}
