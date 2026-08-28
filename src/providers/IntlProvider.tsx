"use client";

import { NextIntlClientProvider } from "next-intl";
import { useEffect, useState } from "react";
import { locales, defaultLocale, type Locale } from "@/i18n/config";

/**
 * Helper: read NEXT_LOCALE cookie from the browser.
 * Falls back to defaultLocale ("fr") if no valid cookie is found.
 */
function getLocaleFromCookie(): Locale {
  try {
    const match = document.cookie.split(";").find((c) => c.trim().startsWith("NEXT_LOCALE="));
    if (match) {
      const value = match.split("=")[1]?.trim();
      if (value && locales.includes(value as Locale)) {
        return value as Locale;
      }
    }
  } catch {
    // cookie access failed
  }
  return defaultLocale;
}

/**
 * Client-side i18n provider.
 * Reads the locale from the NEXT_LOCALE cookie and loads messages dynamically.
 * Falls back to rendering children without translations while messages load.
 */
export default function IntlProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [messages, setMessages] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const currentLocale = getLocaleFromCookie();
    setLocale(currentLocale);

    import(`@/messages/${currentLocale}.json`).then((mod) => {
      setMessages(mod.default);
    });
  }, []);

  // Re-read locale when cookie changes (language switcher)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentLocale = getLocaleFromCookie();
      if (currentLocale !== locale) {
        setLocale(currentLocale);
        import(`@/messages/${currentLocale}.json`).then((mod) => {
          setMessages(mod.default);
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [locale]);

  if (!messages || Object.keys(messages).length === 0) {
    return <>{children}</>;
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
