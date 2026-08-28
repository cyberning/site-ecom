import type { Metadata } from "next";
import { Inter, Noto_Sans_Arabic } from "next/font/google";
import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";
import AuthProvider from "@/providers/AuthProvider";
import ThemeProvider from "@/providers/ThemeProvider";
import IntlProvider from "@/providers/IntlProvider";
import { prisma } from "@/lib/prisma";
import { locales, type Locale } from "@/i18n/config";
import "@/styles/themes.css";
import "./globals.css";

const VALID_THEMES = ["NEUMORPHISM", "LUXURY", "VIBRANT", "ORGANIC", "TECH"] as const;
type ThemeType = (typeof VALID_THEMES)[number];

// Lecture du thème actif depuis la DB, mise en cache cross-requêtes (60s).
// Évite une requête Prisma à chaque chargement de page (layout racine = toutes les
// routes, storefront inclus). Le cookie navigateur reste prioritaire côté client ;
// le cache DB sert uniquement de fallback et se rafraîchit au plus tard après 60s.
const getActiveTheme = unstable_cache(
  async (): Promise<ThemeType> => {
    try {
      const setting = await prisma.setting.findUnique({
        where: { key: "active_theme" },
      });
      const value = setting?.value as string | undefined;
      return value && (VALID_THEMES as readonly string[]).includes(value)
        ? (value as ThemeType)
        : "NEUMORPHISM";
    } catch {
      return "NEUMORPHISM";
    }
  },
  ["active-theme"],
  { revalidate: 60 }
);

const inter = Inter({ subsets: ["latin"] });
const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "e-com.dz — E-Commerce COD Algérie",
    template: "%s | e-com.dz",
  },
  description:
    "Boutique en ligne Algérie — Paiement à la livraison — 69 Wilayas — Livraison rapide",
  keywords: [
    "e-commerce",
    "algerie",
    "cod",
    "paiement livraison",
    "boutique en ligne",
    "69 wilayas",
  ],
  authors: [{ name: "e-com.dz" }],
  openGraph: {
    type: "website",
    locale: "fr_DZ",
    siteName: "e-com.dz",
    title: "e-com.dz — E-Commerce COD Algérie",
    description: "Boutique en ligne Algérie — Paiement à la livraison — 69 Wilayas",
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Detect locale from cookie (set by middleware or language switcher)
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;
  const locale: Locale =
    localeCookie && locales.includes(localeCookie as Locale) ? (localeCookie as Locale) : "fr";
  const dir = locale === "ar" ? "rtl" : "ltr";

  // Thème sauvegardé en DB — utilisé comme fallback quand le cookie est absent
  const dbTheme = await getActiveTheme();

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = document.cookie.split(';').find(function(c) {
                    return c.trim().startsWith('theme=');
                  });
                  if (theme) {
                    document.documentElement.setAttribute('data-theme', theme.split('=')[1]);
                  } else {
                    document.documentElement.setAttribute('data-theme', '${dbTheme}');
                  }
                } catch(e) {
                  document.documentElement.setAttribute('data-theme', '${dbTheme}');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} ${locale === "ar" ? notoArabic.className : ""}`}>
        <AuthProvider>
          <ThemeProvider initialTheme={dbTheme}>
            <IntlProvider>{children}</IntlProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
