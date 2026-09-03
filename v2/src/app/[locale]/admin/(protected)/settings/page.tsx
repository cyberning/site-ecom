import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Setting } from "@/types/admin";
import { SettingsForm } from "@/components/admin/SettingsForm";

async function getSettings(): Promise<Setting[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/admin/settings?category=general`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    return (await res.json()) as Setting[];
  } catch {
    return [];
  }
}

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">
        {t("settings")}
      </h1>

      <SettingsForm settings={settings} />
    </div>
  );
}
