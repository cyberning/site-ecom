import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { locales, defaultLocale, type Locale, ADMIN_LOCALE_COOKIE } from "@/i18n/config";

export default async function AdminUsers() {
  // La langue admin est pilotée par le cookie dédié ADMIN_LOCALE, indépendant
  // du cookie NEXT_LOCALE du storefront. On passe la locale explicitement à
  // getTranslations pour éviter que next-intl ne résolve via src/i18n/request.ts
  // (qui lit NEXT_LOCALE).
  const cookieStore = await cookies();
  const raw = cookieStore.get(ADMIN_LOCALE_COOKIE)?.value;
  const adminLocale: Locale =
    raw && locales.includes(raw as Locale) ? (raw as Locale) : defaultLocale;
  const t = await getTranslations({ locale: adminLocale, namespace: "admin" });

  return (
    <div>
      <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t("usersPage.title")}</h2>
      <p className="mt-2 text-[var(--text-secondary)]">{t("usersPage.subtitle")}</p>
    </div>
  );
}
