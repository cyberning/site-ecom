import Button from "@/components/ui/Button";
import { getTranslations } from "next-intl/server";
import { getStoreSettings } from "@/lib/getStoreSettings";

export default async function HeroBanner() {
  const [t, storeSettings] = await Promise.all([getTranslations("homepage"), getStoreSettings()]);

  return (
    <section
      className="relative overflow-hidden bg-[var(--bg-secondary)] py-16 md:py-24"
      style={
        storeSettings.heroImage
          ? {
              backgroundImage: `url(${storeSettings.heroImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      {storeSettings.heroImage && <div className="absolute inset-0 bg-black/40" />}
      <div className="relative z-10 mx-auto max-w-7xl px-4 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-[var(--text-primary)] md:text-6xl">
          {storeSettings.heroTitle || t("heroTitle")}
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-[var(--text-secondary)]">
          {t("heroSubtitle")}
        </p>

        {/* Trust badges inline */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-4 text-sm text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5 rounded-full bg-[var(--accent-light)] px-3 py-1">
            {t("heroBenefit1")}
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-[var(--accent-light)] px-3 py-1">
            {t("heroBenefit2")}
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-[var(--accent-light)] px-3 py-1">
            {t("heroBenefit3")}
          </span>
        </div>

        <a href="#products">
          <Button size="lg">{t("viewProducts")}</Button>
        </a>
      </div>

      {/* Decorative gradient */}
      <div className="pointer-events-none absolute -bottom-24 left-1/2 h-48 w-[600px] -translate-x-1/2 rounded-full bg-[var(--accent)] opacity-5 blur-3xl" />
    </section>
  );
}
