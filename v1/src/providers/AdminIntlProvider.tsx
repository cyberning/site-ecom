"use client";

import { NextIntlClientProvider, IntlErrorCode } from "next-intl";
import { useEffect, useState } from "react";
import { defaultLocale, type Locale } from "@/i18n/config";
import { getAdminLocaleFromCookie, getStorefrontLocaleFromCookie } from "@/i18n/cookies";

/**
 * Provider i18n dédié au sous-arbre admin (/admin).
 *
 * Ce provider imbriqué override le provider racine (IntlProvider) pour le
 * sous-arbre admin : la langue du dashboard est pilotée par le cookie dédié
 * `ADMIN_LOCALE`, indépendamment du cookie `NEXT_LOCALE` du storefront.
 *
 * Au montage, il synchronise `document.documentElement.lang/dir` avec la
 * locale admin (RTL pour l'arabe). Au démontage, il restaure lang/dir depuis
 * le cookie `NEXT_LOCALE` afin que le storefront ne reste pas en RTL après
 * une visite admin en arabe.
 */
export default function AdminIntlProvider({
  children,
  initialLocale = defaultLocale,
  initialMessages = {},
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
  initialMessages?: Record<string, unknown>;
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [messages, setMessages] = useState<Record<string, unknown>>(initialMessages);

  // Synchronise le state avec les props SSR : après un `router.refresh()`, le
  // layout admin re-rend avec les nouvelles `initialLocale`/`initialMessages`.
  // Sans cet effet, le provider garderait l'ancienne locale jusqu'au polling 1s.
  useEffect(() => {
    setLocale(initialLocale);
    setMessages(initialMessages);
  }, [initialLocale, initialMessages]);

  useEffect(() => {
    const currentLocale = getAdminLocaleFromCookie();
    setLocale(currentLocale);

    import(`@/messages/${currentLocale}.json`).then((mod) => {
      setMessages(mod.default);
    });

    // Synchronise lang/dir du document avec la locale admin
    document.documentElement.lang = currentLocale;
    document.documentElement.dir = currentLocale === "ar" ? "rtl" : "ltr";

    // Au démontage : restaure lang/dir depuis le cookie NEXT_LOCALE du
    // storefront pour ne pas laisser le document en RTL après une visite admin.
    return () => {
      const storefrontLocale = getStorefrontLocaleFromCookie();
      document.documentElement.lang = storefrontLocale;
      document.documentElement.dir = storefrontLocale === "ar" ? "rtl" : "ltr";
    };
  }, []);

  // Re-read locale when ADMIN_LOCALE cookie changes (admin language switcher)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentLocale = getAdminLocaleFromCookie();
      if (currentLocale !== locale) {
        setLocale(currentLocale);
        import(`@/messages/${currentLocale}.json`).then((mod) => {
          setMessages(mod.default);
        });
        document.documentElement.lang = currentLocale;
        document.documentElement.dir = currentLocale === "ar" ? "rtl" : "ltr";
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [locale]);

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone="Africa/Algiers"
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
