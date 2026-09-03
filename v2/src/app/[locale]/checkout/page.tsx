import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckoutForm } from "@/components/storefront/CheckoutForm";
import type { Wilaya } from "@/types/storefront";

async function getWilayas(): Promise<Wilaya[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/wilayas`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as Wilaya[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("checkout");

  const wilayas = await getWilayas();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 font-heading text-3xl font-bold text-[var(--text-primary)]">
        {t("title")}
      </h1>
      <p className="mb-8 text-[var(--text-secondary)]">{t("subtitle")}</p>
      <CheckoutForm wilayas={wilayas} />
    </div>
  );
}
