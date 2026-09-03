import { locales, defaultLocale, type Locale } from "@/i18n/config";
import { ADMIN_LOCALE_COOKIE, NEXT_LOCALE_COOKIE } from "@/i18n/config";

/**
 * Lit une locale depuis un cookie navigateur (côté client uniquement, pas de
 * `next/headers` ici). Valide la valeur contre la liste des locales supportées
 * et retombe sur `defaultLocale` si le cookie est absent ou invalide.
 */
export function getLocaleFromCookie(cookieName: string): Locale {
  try {
    const match = document.cookie.split(";").find((c) => c.trim().startsWith(`${cookieName}=`));
    if (match) {
      const value = match.split("=")[1]?.trim();
      if (value && locales.includes(value as Locale)) {
        return value as Locale;
      }
    }
  } catch {
    // Accès au cookie impossible (SSR, navigateur restreint) : fallback.
  }
  return defaultLocale;
}

/**
 * Lit la locale du dashboard admin depuis le cookie dédié ADMIN_LOCALE,
 * indépendant du cookie NEXT_LOCALE du storefront.
 */
export function getAdminLocaleFromCookie(): Locale {
  return getLocaleFromCookie(ADMIN_LOCALE_COOKIE);
}

/**
 * Lit la locale du storefront depuis le cookie NEXT_LOCALE.
 */
export function getStorefrontLocaleFromCookie(): Locale {
  return getLocaleFromCookie(NEXT_LOCALE_COOKIE);
}
