import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login");
  }

  // Seuls les ADMIN ont accès aux pages protégées (theme, settings,
  // products). Les CALL_AGENT sont redirigés vers le dashboard.
  if (session.user.role !== "ADMIN") {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
