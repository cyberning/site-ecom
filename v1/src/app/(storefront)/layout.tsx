import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { getStoreSettings } from "@/lib/getStoreSettings";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import StorefrontPixelWrapper from "@/components/storefront/StorefrontPixelWrapper";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [t, storeSettings] = await Promise.all([getTranslations("common"), getStoreSettings()]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg-card)]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] text-sm font-bold text-white">
              E
            </div>
            <span className="text-xl font-bold text-[var(--text-primary)]">
              {storeSettings.storeName || "E-Com DZ"}
            </span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex" aria-label="Navigation principale">
            <Link
              href="/"
              className="text-sm font-medium text-[var(--text-secondary)] transition-[var(--transition)] hover:text-[var(--accent)]"
            >
              {t("home")}
            </Link>
            <Link
              href="/#products"
              className="text-sm font-medium text-[var(--text-secondary)] transition-[var(--transition)] hover:text-[var(--accent)]"
            >
              {t("products")}
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main */}
      <StorefrontPixelWrapper>
        <main>{children}</main>
      </StorefrontPixelWrapper>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--bg-card)]">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] text-sm font-bold text-white">
                  E
                </div>
                <span className="text-lg font-bold text-[var(--text-primary)]">
                  {storeSettings.storeName || "E-Com DZ"}
                </span>
              </div>
              <p className="text-sm text-[var(--text-muted)]">{t("footerDesc")}</p>
            </div>
            <div>
              <h4 className="mb-3 font-semibold text-[var(--text-primary)]">{t("informations")}</h4>
              <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                <li>{t("cashOnDelivery")}</li>
                <li>{t("inspection")}</li>
                <li>{t("delivery69")}</li>
                <li>{t("customerService")}</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-semibold text-[var(--text-primary)]">{t("contact")}</h4>
              <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                <li>📧 {storeSettings.contactEmail || "contact@ecom-dz.com"}</li>
                <li>📱 {storeSettings.contactPhone || "+213 XX XX XX XX"}</li>
                <li>📍 {storeSettings.contactAddress || "Alger, Algérie"}</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-[var(--border)] pt-6 text-center text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} {storeSettings.storeName || "E-Com DZ"}.{" "}
            {t("allRightsReserved")}
          </div>
        </div>
      </footer>
    </div>
  );
}
