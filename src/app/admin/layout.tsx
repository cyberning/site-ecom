import type { Metadata } from "next";
import AuthProvider from "@/providers/AuthProvider";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";

export const metadata: Metadata = {
  title: "Admin — E-Commerce DZ",
  robots: "noindex, nofollow",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <AdminLayoutClient>{children}</AdminLayoutClient>
        </AuthProvider>
      </body>
    </html>
  );
}
