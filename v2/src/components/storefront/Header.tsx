"use client";

import { useTranslations } from "next-intl";
import { ShoppingCart, Store } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/context/CartContext";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
  const t = useTranslations("storefront");
  const { itemCount, openCart } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg-secondary)]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-heading text-lg font-bold text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <Store className="h-6 w-6 text-[var(--accent)]" aria-hidden="true" />
          <span>E-Commerce DZ</span>
        </Link>

        <nav
          className="hidden items-center gap-6 md:flex"
          aria-label={t("nav")}
        >
          <Link
            href="/"
            className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
          >
            {t("home")}
          </Link>
          <Link
            href="/products"
            className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
          >
            {t("products")}
          </Link>
          <Link
            href="/track"
            className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
          >
            {t("trackOrder")}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={openCart}
            aria-label={`${t("cart")} (${itemCount})`}
            className="relative rounded-full p-2.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-input)] hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {itemCount > 0 && (
              <span className="absolute -end-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-xs font-bold text-white">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <nav
        className="flex items-center justify-around border-t border-[var(--border)] px-4 py-2 md:hidden"
        aria-label={t("nav")}
      >
        <Link
          href="/"
          className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent)]"
        >
          {t("home")}
        </Link>
        <Link
          href="/products"
          className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent)]"
        >
          {t("products")}
        </Link>
        <Link
          href="/track"
          className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent)]"
        >
          {t("trackOrder")}
        </Link>
      </nav>
    </header>
  );
}
