"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertIcon, CloseIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/modal";
import { formatAppointment, formatTime, initials } from "@/lib/format";
import type { Conversation } from "@/lib/types";
import { AppointmentStatusBadge, isMedicalHandoff, ModeBadge } from "./status-badges";

export function PatientPanel({
  conversation,
  onCancelAppointment,
  onClose,
}: {
  conversation: Conversation;
  onCancelAppointment: () => void;
  onClose: () => void;
}) {
  const { patient, appointment, handoff, mode } = conversation;
  const [dialog, setDialog] = useState<"view" | "cancel" | null>(null);
  const cancellable = appointment !== null && (appointment.status === "confirmed" || appointment.status === "pending");

  return (
    <aside className="flex h-full flex-col bg-white">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 px-5">
        <h2 className="text-[13px] font-semibold tracking-wide text-zinc-500 uppercase">Patient</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 xl:hidden"
          aria-label="Close patient details"
        >
          <CloseIcon className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center gap-2 border-b border-zinc-100 px-5 py-6 text-center">
          <div className="grid size-14 place-items-center rounded-full bg-zinc-100 text-base font-semibold text-zinc-600">
            {initials(patient.name)}
          </div>
          <div>
            <p className="text-base font-semibold text-zinc-900">{patient.name}</p>
            <p className="text-sm text-zinc-500 tabular-nums">{patient.phone}</p>
          </div>
        </div>

        <dl className="divide-y divide-zinc-100 px-5">
          <Field label="Conversation status">
            <ModeBadge mode={mode} long />
          </Field>
          <Field label="Handoff reason">
            {handoff ? (
              <div
                className={`flex gap-2 rounded-lg px-3 py-2 text-[13px] ring-1 ${
                  isMedicalHandoff(conversation)
                    ? "bg-rose-50/70 text-rose-900 ring-rose-100"
                    : "bg-amber-50/70 text-amber-900 ring-amber-100"
                }`}
              >
                <AlertIcon className="mt-0.5 size-4 shrink-0 opacity-70" />
                <div>
                  <p className="font-medium">{handoff.reason}</p>
                  {handoff.requestedAt && (
                    <p className="mt-0.5 text-xs opacity-70">Requested at {formatTime(handoff.requestedAt)}</p>
                  )}
                </div>
              </div>
            ) : (
              <span className="text-zinc-400">No active handoff</span>
            )}
          </Field>
          <Field label="Current appointment">
            {appointment ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className={`font-medium ${appointment.status === "cancelled" ? "text-zinc-400 line-through" : "text-zinc-900"}`}>
                    {formatAppointment(appointment.startsAt)}
                  </p>
                </div>
                <p className="text-[13px] text-zinc-500">{appointment.treatment}</p>
                <AppointmentStatusBadge status={appointment.status} />
              </div>
            ) : (
              <span className="text-zinc-400">No upcoming appointment</span>
            )}
          </Field>
          {conversation.workflow && (
            <Field label="AI booking state">
              <dl className="grid grid-cols-[100px_1fr] gap-x-3 gap-y-1 text-[13px]">
                <dt className="text-zinc-500">Stage</dt>
                <dd className="font-medium text-zinc-900">{conversation.workflow.stage || "—"}</dd>
                <dt className="text-zinc-500">Pending action</dt>
                <dd className="text-zinc-900">{conversation.workflow.pendingAction || "—"}</dd>
                {conversation.workflow.proposedSlots && (
                  <>
                    <dt className="text-zinc-500">Proposed slots</dt>
                    <dd className="break-words text-zinc-900">{conversation.workflow.proposedSlots}</dd>
                  </>
                )}
              </dl>
            </Field>
          )}
          <Field label="Treatment interest">
            {patient.treatmentInterest ? (
              <span className="font-medium text-zinc-900">{patient.treatmentInterest}</span>
            ) : (
              <span className="text-zinc-400">Not specified</span>
            )}
          </Field>
        </dl>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-zinc-200 p-4">
        <Button variant="secondary" disabled={!appointment} onClick={() => setDialog("view")}>
          View appointment
        </Button>
        <Button variant="danger" disabled={!cancellable} onClick={() => setDialog("cancel")}>
          Cancel appointment
        </Button>
      </div>

      {appointment && (
        <>
          <Modal
            open={dialog === "view"}
            onClose={() => setDialog(null)}
            title="Appointment details"
            footer={
              <Button variant="secondary" onClick={() => setDialog(null)}>
                Close
              </Button>
            }
          >
            <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-2.5">
              <dt className="text-zinc-500">Patient</dt>
              <dd className="font-medium">{patient.name}</dd>
              <dt className="text-zinc-500">Treatment</dt>
              <dd>{appointment.treatment}</dd>
              <dt className="text-zinc-500">When</dt>
              <dd>{formatAppointment(appointment.startsAt)}</dd>
              {appointment.durationMinutes != null && (
                <>
                  <dt className="text-zinc-500">Duration</dt>
                  <dd>{appointment.durationMinutes} min</dd>
                </>
              )}
              {appointment.practitioner && (
                <>
                  <dt className="text-zinc-500">Practitioner</dt>
                  <dd>{appointment.practitioner}</dd>
                </>
              )}
              {appointment.room && (
                <>
                  <dt className="text-zinc-500">Room</dt>
                  <dd>{appointment.room}</dd>
                </>
              )}
              <dt className="text-zinc-500">Status</dt>
              <dd>
                <AppointmentStatusBadge status={appointment.status} />
              </dd>
              {appointment.notes && (
                <>
                  <dt className="text-zinc-500">Notes</dt>
                  <dd className="text-zinc-700">{appointment.notes}</dd>
                </>
              )}
            </dl>
          </Modal>

          <Modal
            open={dialog === "cancel"}
            onClose={() => setDialog(null)}
            title="Cancel appointment?"
            footer={
              <>
                <Button variant="secondary" onClick={() => setDialog(null)}>
                  Keep appointment
                </Button>
                <Button
                  variant="dangerSolid"
                  onClick={() => {
                    onCancelAppointment();
                    setDialog(null);
                  }}
                >
                  Cancel appointment
                </Button>
              </>
            }
          >
            <p className="text-zinc-600">
              <span className="font-medium text-zinc-900">{appointment.treatment}</span> for {patient.name} on{" "}
              {formatAppointment(appointment.startsAt)} will be marked as cancelled.
            </p>
            <p className="mt-2 text-xs text-zinc-500">Demo mode: this only updates local data. No calendar event or message is sent.</p>
          </Modal>
        </>
      )}
    </aside>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-4">
      <dt className="mb-1.5 text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}
