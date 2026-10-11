/**
 * Data access layer.
 *
 * Every page reads data through these functions. Today they return mock data;
 * later, swap the bodies for database / n8n / Google Calendar calls without
 * touching the UI. They are async on purpose so call sites won't need to change.
 */
import {
  MOCK_NOW,
  mockAppointments,
  mockClinic,
  mockConversations,
  mockCurrentUser,
  mockPatients,
} from "@/lib/mock/data";
import { fetchN8nConversations } from "@/lib/n8n/conversations";
import { fetchN8nMessages } from "@/lib/n8n/messages";
import type { Appointment, Conversation, Message, Patient, StaffUser } from "@/lib/types";

export type AppointmentWithPatient = Appointment & { patient: Patient | null };

export type Integration = {
  id: string;
  name: string;
  description: string;
  connected: boolean;
};

/** Reference time used for relative labels ("Today", "Yesterday"). */
export function getReferenceNow(): string {
  return MOCK_NOW;
}

export type ConversationsResult = {
  conversations: Conversation[];
  source: "n8n" | "mock" | "error";
  /** Set when the n8n endpoint could not be read. */
  error?: string;
};

/**
 * Conversations from the n8n webhook. If it fails, development falls back to
 * mock data so the UI stays usable; production returns an empty list + error.
 */
export async function getConversations(): Promise<ConversationsResult> {
  try {
    return { conversations: await fetchN8nConversations(), source: "n8n" };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    console.error("[conversations] n8n fetch failed:", error);
    if (process.env.NODE_ENV === "development") {
      return { conversations: structuredClone(mockConversations), source: "mock", error };
    }
    return { conversations: [], source: "error", error };
  }
}

/** Full chat history for one conversation, oldest → newest. Throws if n8n can't be read. */
export async function getConversationMessages(phoneDigits: string): Promise<Message[]> {
  return fetchN8nMessages(phoneDigits);
}

export async function getAppointments(): Promise<AppointmentWithPatient[]> {
  return mockAppointments
    .map((a) => ({ ...a, patient: mockPatients.find((p) => p.id === a.patientId) ?? null }))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export async function getCurrentUser(): Promise<StaffUser> {
  return mockCurrentUser;
}

export async function getClinicSettings() {
  return mockClinic;
}

export async function getIntegrations(): Promise<Integration[]> {
  return [
    { id: "whatsapp", name: "WhatsApp Cloud API", description: "Receive and send patient messages.", connected: false },
    { id: "n8n", name: "n8n", description: "AI receptionist workflows and handoff automation.", connected: false },
    { id: "gcal", name: "Google Calendar", description: "Sync appointments and availability.", connected: false },
    { id: "db", name: "Database", description: "Persist patients, conversations and audit history.", connected: false },
  ];
}
