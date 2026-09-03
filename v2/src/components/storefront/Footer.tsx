import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-secondary)]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        <div>
          <h3 className="mb-3 font-heading text-base font-bold text-[var(--text-primary)]">
            E-Commerce DZ
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">{t("tagline")}</p>
        </div>

        <div>
          <h3 className="mb-3 font-heading text-base font-bold text-[var(--text-primary)]">
            {t("shop")}
          </h3>
          <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
            <li>
              <Link href="/products" className="hover:text-[var(--accent)]">
                {t("allProducts")}
              </Link>
            </li>
            <li>
              <Link href="/track" className="hover:text-[var(--accent)]">
                {t("trackOrder")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-heading text-base font-bold text-[var(--text-primary)]">
            {t("contact")}
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            {t("codOnly")}
          </p>
        </div>
      </div>

      <div className="border-t border-[var(--border)] py-4 text-center text-xs text-[var(--text-muted)]">
        © {new Date().getFullYear()} E-Commerce DZ — {t("rights")}
      </div>
    </footer>
  );
}
