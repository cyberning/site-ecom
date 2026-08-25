"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { locales, localeNames, localeFlags, type Locale } from "@/i18n/config";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const switchLocale = (newLocale: Locale) => {
    // Persist locale choice in cookie (server will read it via NEXT_LOCALE)
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    // Also update the html lang/dir attributes immediately for instant RTL feedback
    document.documentElement.lang = newLocale;
    document.documentElement.dir = newLocale === "ar" ? "rtl" : "ltr";
    // Refresh the page so server components re-render with new locale
    router.refresh();
    setIsOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-2 text-sm",
          "bg-[var(--bg-card)] text-[var(--text-primary)] transition-[var(--transition)]",
          "hover:border-[var(--accent)]"
        )}
      >
        <span>{localeFlags[locale as Locale]}</span>
        <span>{localeNames[locale as Locale]}</span>
        <svg
          className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 z-50 mt-1 w-40 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-card)] shadow-lg">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => switchLocale(loc)}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-sm transition-[var(--transition)]",
                "hover:bg-[var(--accent-light)]",
                loc === locale
                  ? "bg-[var(--accent-light)] font-medium text-[var(--accent)]"
                  : "text-[var(--text-primary)]"
              )}
            >
              <span>{localeFlags[loc]}</span>
              <span>{localeNames[loc]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
