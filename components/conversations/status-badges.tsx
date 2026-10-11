import { Badge } from "@/components/ui/badge";
import type { AppointmentStatus, Conversation } from "@/lib/types";

export function ModeBadge({ mode, long = false }: { mode: Conversation["mode"]; long?: boolean }) {
  if (mode === "AI") {
    return (
      <Badge tone="ai" dot>
        {long ? "AI active" : "AI"}
      </Badge>
    );
  }
  return (
    <Badge tone="human" dot>
      {long ? "Human control" : "Human"}
    </Badge>
  );
}

export function MedicalHandoffBadge() {
  return <Badge tone="medical">Medical handoff</Badge>;
}

/** Inbox badge for any active handoff; medical ones keep their dedicated style. */
export function HandoffBadge({ conversation }: { conversation: Conversation }) {
  if (!conversation.handoff) return null;
  if (isMedicalHandoff(conversation)) return <MedicalHandoffBadge />;
  return <Badge tone="human">Handoff</Badge>;
}

export function isMedicalHandoff(c: Conversation): boolean {
  return c.handoff?.kind === "medical";
}

const appointmentTone = {
  confirmed: "success",
  pending: "human",
  cancelled: "medical",
  completed: "muted",
} as const;

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge tone={appointmentTone[status]}>{status}</Badge>;
}
