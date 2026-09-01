"use client";

import { useRouter } from "next/navigation";
import {
  locales,
  defaultLocale,
  localeNames,
  localeFlags,
  ADMIN_LOCALE_COOKIE,
  type Locale,
} from "@/i18n/config";
import { getAdminLocaleFromCookie } from "@/i18n/cookies";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Languages } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Sélecteur de langue du dashboard admin.
 *
 * Ce composant pilote le cookie dédié `ADMIN_LOCALE` (constante
 * `ADMIN_LOCALE_COOKIE` dans `@/i18n/config`), indépendamment du cookie
 * `NEXT_LOCALE` utilisé par le storefront. Le layout admin
 * (`src/app/admin/layout.tsx`) lit ce cookie côté serveur pour fournir les
 * messages i18n au sous-arbre /admin, et `AdminIntlProvider` synchronise
 * `lang`/`dir` côté client.
 */

export default function AdminLanguageSwitcher() {
  const router = useRouter();
  const t = useTranslations("admin");

  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Lit la locale admin depuis le cookie au montage
  useEffect(() => {
    setLocale(getAdminLocaleFromCookie());
  }, []);

  // Ferme le dropdown au clic extérieur ou à la touche Échap (uniquement quand ouvert)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("keydown", handleKey);
      return () => {
        document.removeEventListener("mousedown", handleClick);
        document.removeEventListener("keydown", handleKey);
      };
    }
  }, [isOpen]);

  const switchLocale = (newLocale: Locale) => {
    // Persiste le choix dans le cookie ADMIN_LOCALE (lu par le layout admin)
    document.cookie = `${ADMIN_LOCALE_COOKIE}=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    // Met à jour lang/dir immédiatement pour un feedback RTL instantané
    document.documentElement.lang = newLocale;
    document.documentElement.dir = newLocale === "ar" ? "rtl" : "ltr";
    // Met à jour l'état local : sans cela, router.refresh() préserve l'état du
    // client component et la coche/surlignage resteraient sur l'ancienne langue
    setLocale(newLocale);
    // Rafraîchit les composants serveur avec la nouvelle locale
    router.refresh();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] transition-[var(--transition)]",
          isOpen
            ? "bg-[var(--accent-light)] text-[var(--accent)]"
            : "text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
        )}
        aria-label={t("header.changeLanguage")}
        aria-controls="admin-language-menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Languages className="h-[18px] w-[18px]" />
      </button>

      {isOpen && (
        <div
          id="admin-language-menu"
          className="absolute top-full right-0 z-50 mt-2 w-44 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-2 shadow-lg"
          role="menu"
          aria-labelledby="admin-language-menu-title"
        >
          <p
            id="admin-language-menu-title"
            className="mb-1.5 px-2 text-xs font-medium text-[var(--text-muted)]"
          >
            {t("header.language")}
          </p>
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => switchLocale(loc)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-sm transition-[var(--transition)]",
                loc === locale
                  ? "bg-[var(--accent-light)] text-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
              )}
              role="menuitem"
              aria-current={loc === locale ? "true" : undefined}
            >
              <span aria-hidden="true">{localeFlags[loc]}</span>
              <span>{localeNames[loc]}</span>
              {loc === locale && (
                <span aria-hidden="true" className="ml-auto text-[var(--accent)]">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
