import { getRequestConfig } from "next-intl/server";
import { locales, type Locale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !locales.includes(locale as Locale)) {
    // Fallback: try to read from cookie via next/headers
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
      if (cookieLocale && locales.includes(cookieLocale as Locale)) {
        locale = cookieLocale;
      } else {
        locale = "fr";
      }
    } catch {
      locale = "fr";
    }
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
