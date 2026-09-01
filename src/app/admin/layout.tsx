import type { Metadata } from "next";
import { cookies } from "next/headers";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";
import AdminIntlProvider from "@/providers/AdminIntlProvider";
import { locales, defaultLocale, type Locale } from "@/i18n/config";

export const metadata: Metadata = {
  title: "Admin — E-Commerce DZ",
  robots: "noindex, nofollow",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Langue du dashboard admin pilotée par le cookie dédié ADMIN_LOCALE,
  // indépendamment du cookie NEXT_LOCALE du storefront.
  const cookieStore = await cookies();
  const adminLocaleCookie = cookieStore.get("ADMIN_LOCALE")?.value;
  const adminLocale: Locale =
    adminLocaleCookie && locales.includes(adminLocaleCookie as Locale)
      ? (adminLocaleCookie as Locale)
      : defaultLocale;

  const messages = (await import(`../../messages/${adminLocale}.json`)).default;

  return (
    <AdminIntlProvider initialLocale={adminLocale} initialMessages={messages}>
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </AdminIntlProvider>
  );
}
