import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { getClinicSettings, getIntegrations } from "@/lib/data";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [clinic, integrations] = await Promise.all([getClinicSettings(), getIntegrations()]);

  return (
    <>
      <PageHeader title="Settings" description="Clinic profile and integrations" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <Card title="Clinic" description="Shown to patients by the AI receptionist.">
            <dl className="divide-y divide-zinc-100">
              <Row label="Name" value={clinic.name} />
              <Row label="City" value={clinic.city} />
              <Row label="WhatsApp number" value={clinic.whatsappNumber} />
              <Row label="Opening hours" value={clinic.openingHours} />
              <Row label="Timezone" value={clinic.timezone} />
            </dl>
          </Card>

          <Card title="AI receptionist" description="Escalation rules applied before replying.">
            <ul className="space-y-2.5 text-sm text-zinc-700">
              <li>• Clinical or post-treatment questions are handed off to medical staff.</li>
              <li>• Billing and invoice requests are handed off to reception.</li>
              <li>• Bookings, rescheduling, prices and reminders are handled automatically.</li>
            </ul>
          </Card>

          <Card title="Integrations" description="Not connected yet — the dashboard runs on mock data.">
            <ul className="divide-y divide-zinc-100">
              {integrations.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{i.name}</p>
                    <p className="text-xs text-zinc-500">{i.description}</p>
                  </div>
                  <Badge tone={i.connected ? "success" : "muted"}>{i.connected ? "Connected" : "Not connected"}</Badge>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}

function Card({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white shadow-xs">
      <div className="border-b border-zinc-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
      <div className="px-5 py-3">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-4 py-2.5 text-sm">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-zinc-900">{value}</dd>
    </div>
  );
}
