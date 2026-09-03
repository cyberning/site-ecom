import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { CartProvider } from "@/context/CartContext";
import { StorefrontChrome } from "@/components/storefront/StorefrontChrome";
import { prisma } from "@/lib/prisma";

/** Maps a DB setting key to its CSS custom-property name. */
const THEME_CSS_MAP: Record<string, string> = {
  accent: "--accent",
  accentHover: "--accent-hover",
  bgPrimary: "--bg-primary",
  bgSecondary: "--bg-secondary",
  textPrimary: "--text-primary",
  textSecondary: "--text-secondary",
  border: "--border",
};

/**
 * Parse a setting value that may be JSON-stringified (e.g. `"\"#ff0000\""`)
 * and fall back to the raw string when parsing fails.
 */
function parseSettingValue(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : String(parsed);
  } catch {
    return raw;
  }
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const isRtl = locale === "ar";

  // Load custom theme settings from the DB and build inline CSS variables.
  const themeSettings = await prisma.setting.findMany({
    where: { category: "theme" },
    select: { key: true, value: true },
  });

  const cssVars: Record<string, string> = {};
  for (const setting of themeSettings) {
    const cssVar = THEME_CSS_MAP[setting.key];
    if (!cssVar) continue;
    const parsed = parseSettingValue(setting.value);
    if (parsed) {
      cssVars[cssVar] = parsed;
    }
  }

  return (
    <html
      lang={locale}
      dir={isRtl ? "rtl" : "ltr"}
      style={Object.keys(cssVars).length > 0 ? cssVars : undefined}
    >
      <body className="flex min-h-screen flex-col">
        <NextIntlClientProvider>
          <CartProvider>
            <StorefrontChrome>{children}</StorefrontChrome>
          </CartProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
