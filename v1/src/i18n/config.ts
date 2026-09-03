export const locales = ["fr", "ar", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

export const localeNames: Record<Locale, string> = {
  fr: "Français",
  ar: "العربية",
  en: "English",
};

export const localeFlags: Record<Locale, string> = {
  fr: "🇫🇷",
  ar: "🇩🇿",
  en: "🇬🇧",
};

// Cookie dédié à la langue du dashboard admin, indépendant du storefront
export const ADMIN_LOCALE_COOKIE = "ADMIN_LOCALE";

// Cookie de la langue du storefront (lu par src/i18n/request.ts côté serveur)
export const NEXT_LOCALE_COOKIE = "NEXT_LOCALE";
