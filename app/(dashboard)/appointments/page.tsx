import type { Metadata } from "next";
import { AppointmentStatusBadge } from "@/components/conversations/status-badges";
import { PageHeader } from "@/components/page-header";
import { getAppointments, getReferenceNow } from "@/lib/data";
import { formatLongDate, formatTime } from "@/lib/format";

export const metadata: Metadata = { title: "Appointments" };

export default async function AppointmentsPage() {
  const appointments = await getAppointments();
  const now = getReferenceNow();
  const upcoming = appointments.filter((a) => Date.parse(a.startsAt) >= Date.parse(now) && a.status !== "cancelled");

  const stats = [
    { label: "Upcoming", value: upcoming.length },
    { label: "Confirmed", value: upcoming.filter((a) => a.status === "confirmed").length },
    { label: "Awaiting confirmation", value: upcoming.filter((a) => a.status === "pending").length },
  ];

  return (
    <>
      <PageHeader title="Appointments" description="Mock schedule · Google Calendar not connected" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
                <p className="text-xs font-medium text-zinc-500">{s.label}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-xs">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50/70 text-xs text-zinc-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">Patient</th>
                  <th className="px-4 py-2.5 font-medium">Treatment</th>
                  <th className="px-4 py-2.5 font-medium">Practitioner</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-50/60">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-medium text-zinc-900">{formatLongDate(a.startsAt)}</p>
                      <p className="text-xs text-zinc-500 tabular-nums">
                        {formatTime(a.startsAt)} · {a.durationMinutes} min
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">{a.patient?.name ?? "Unknown"}</p>
                      <p className="text-xs text-zinc-500 tabular-nums">{a.patient?.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{a.treatment}</td>
                    <td className="px-4 py-3 text-zinc-700">
                      {a.practitioner}
                      <p className="text-xs text-zinc-500">{a.room}</p>
                    </td>
                    <td className="px-4 py-3">
                      <AppointmentStatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
