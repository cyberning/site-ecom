"use client";

import { NextIntlClientProvider } from "next-intl";
import { useEffect, useState } from "react";
import { locales, defaultLocale, type Locale } from "@/i18n/config";
import { IntlErrorCode } from "next-intl";

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
 *
 * IMPORTANT: `NextIntlClientProvider` est rendu dès le premier rendu (avec des
 * messages vides) afin que `useTranslations` appelé par les composants enfants
 * (ex: AdminLayoutClient) ait TOUJOURS un provider disponible. Sans cela,
 * `useTranslations` hors d'un `NextIntlClientProvider` lève une erreur pendant
 * le SSR / le premier rendu client, tant que les messages ne sont pas chargés.
 *
 * Avec des messages vides, `t("clé")` retourne la clé brute via
 * `getMessageFallback` — acceptable pour un état de chargement transitoire,
 * remplacé dès que les messages arrivent. `onError` ignore les erreurs
 * `MISSING_MESSAGE` (attendues pendant le chargement) tout en laissant passer
 * les autres erreurs.
 */
export default function IntlProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [messages, setMessages] = useState<Record<string, unknown>>({});

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

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      getMessageFallback={({ key, namespace }) => (namespace ? `${namespace}.${key}` : key)}
      onError={(error) => {
        // Les messages manquants pendant le chargement (messages vides) sont
        // attendus et non-bloquants : on les ignore pour ne pas polluer la
        // console. Les autres erreurs (formatage, etc.) restent visibles.
        if (error.code === IntlErrorCode.MISSING_MESSAGE) return;
        console.error(error);
      }}
    >
      {children}
    </NextIntlClientProvider>
  );
}
