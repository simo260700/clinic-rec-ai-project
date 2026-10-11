import { Sidebar } from "@/components/sidebar";
import { getCurrentUser } from "@/lib/data";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex h-dvh overflow-hidden bg-zinc-50">
      <Sidebar user={user} />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
