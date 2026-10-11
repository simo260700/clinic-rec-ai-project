/**
 * Domain types shared by the dashboard.
 * These mirror the shape we expect from the future backend
 * (database + n8n + WhatsApp Cloud API + Google Calendar).
 */

/** Who is currently answering the patient on WhatsApp. */
export type ConversationMode = "AI" | "HUMAN";

export type MessageSender = "patient" | "ai" | "staff";

export interface Message {
  id: string;
  sender: MessageSender;
  text: string;
  /** ISO 8601 timestamp. */
  sentAt: string;
  /** Display name for staff messages (e.g. "Martina · Reception"). */
  authorName?: string;
  /** Added locally right after sending; dropped once the server copy shows up in the history. */
  local?: boolean;
}

export type HandoffKind = "medical" | "administrative" | "manual";

export interface Handoff {
  kind: HandoffKind;
  reason: string;
  /** ISO 8601 timestamp. */
  requestedAt: string;
}

export interface Patient {
  id: string;
  name: string;
  /** E.164 formatted phone number, used as the WhatsApp identifier. */
  phone: string;
  treatmentInterest: string;
}

export type AppointmentStatus = "confirmed" | "pending" | "cancelled" | "completed";

export interface Appointment {
  id: string;
  patientId: string;
  treatment: string;
  /** ISO 8601 timestamp. */
  startsAt: string;
  /** Not provided by every source (e.g. n8n bookings). */
  durationMinutes?: number;
  practitioner?: string;
  room?: string;
  status: AppointmentStatus;
  notes?: string;
}

export interface Conversation {
  id: string;
  patient: Patient;
  mode: ConversationMode;
  unreadCount: number;
  handoff: Handoff | null;
  /** The patient's next/current appointment, if any. */
  appointment: Appointment | null;
  /** Ordered oldest → newest. */
  messages: Message[];
  /** ISO 8601 timestamp of the latest activity, when the source provides it. */
  lastMessageAt?: string;
  /** Message shown in the inbox row; defaults to the last message. */
  preview?: Message | null;
  /** AI receptionist booking state (from n8n). */
  workflow?: ConversationWorkflow | null;
}

export interface ConversationWorkflow {
  stage: string;
  pendingAction: string;
  proposedSlots: string;
}

export interface StaffUser {
  id: string;
  name: string;
  role: string;
}
