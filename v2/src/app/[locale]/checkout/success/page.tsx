import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CheckCircle2 } from "lucide-react";

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ trackingId?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("checkout");
  const sp = await searchParams;
  const trackingId = sp.trackingId ?? "";

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-16 text-center sm:px-6">
      <CheckCircle2
        className="mb-4 h-16 w-16 text-green-500"
        aria-hidden="true"
      />
      <h1 className="mb-2 font-heading text-3xl font-bold text-[var(--text-primary)]">
        {t("successTitle")}
      </h1>
      <p className="mb-6 text-[var(--text-secondary)]">{t("successMessage")}</p>

      {trackingId && (
        <div className="mb-8 w-full rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--card-shadow)]">
          <p className="mb-2 text-sm text-[var(--text-muted)]">
            {t("trackingId")}
          </p>
          <p className="font-mono text-2xl font-bold tracking-wider text-[var(--accent)]">
            {trackingId}
          </p>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            {t("saveTrackingId")}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href={`/track${trackingId ? `?trackingId=${trackingId}` : ""}`}
          className="rounded-[var(--btn-radius)] bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
        >
          {t("trackOrder")}
        </Link>
        <Link
          href="/products"
          className="rounded-[var(--btn-radius)] border border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-input)]"
        >
          {t("continueShopping")}
        </Link>
      </div>
    </div>
  );
}
